import { either as E, ioOption as IO, json as J } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { Predicate } from "fp-ts/lib/Predicate";
import * as t from "io-ts";
import {
  ChangeEventHandler,
  FormEventHandler,
  useCallback,
  useReducer
} from "react";
import { match } from "ts-pattern";
import { useMutation } from "../../../modules/react";
import { InvokeBody, InvokeResult } from "../../../pages/api/invoke";
import { Button } from "../../button";
import { FormItem } from "../../form-item";
import { Select } from "../../select";
import { BodyControls } from "./body-controls";
import { EntityIDControls } from "./entity-id-controls";

const Api = t.keyof({ "create-payment": null, "get-payment-details": null });

type Api = t.TypeOf<typeof Api>;

type FormState = {
  api: Api;
  payload: {
    "create-payment": {
      body: string;
    };
    "get-payment-details": {
      paymentID: string;
    };
  };
};

type Action =
  | { type: "change-api"; payload: { api: Api } }
  | {
      type: "change-create-payment-body";
      payload: { body: string };
    }
  | {
      type: "change-get-payment-details-payment-id";
      payload: { paymentID: string };
    };

function reducer(state: FormState, action: Action): FormState {
  return match<Action, FormState>(action)
    .with({ type: "change-api" }, (action) => ({
      api: action.payload.api,
      payload: state.payload,
    }))
    .with({ type: "change-create-payment-body" }, (action) => ({
      api: state.api,
      payload: {
        ...state.payload,
        "create-payment": {
          body: action.payload.body,
        },
      },
    }))
    .with({ type: "change-get-payment-details-payment-id" }, (action) => ({
      api: state.api,
      payload: {
        ...state.payload,
        "get-payment-details": {
          paymentID: action.payload.paymentID,
        },
      },
    }))
    .exhaustive();
}

const isValid: Predicate<FormState> = (formState) =>
  match(formState)
    .with({ api: "create-payment" }, ({ api, payload }) =>
      pipe(payload[api].body, J.parse, E.isRight)
    )
    .with({ api: "get-payment-details" }, ({ api, payload }) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payload[api].paymentID
      )
    )
    .exhaustive();

const initialFormState: FormState = {
  api: "create-payment",
  payload: {
    "create-payment": {
      body: JSON.stringify(
        {
          flow: "MATCH_CODE",
          amount_unit: 100,
          currency: "EUR",
        },
        null,
        2
      ),
    },
    "get-payment-details": {
      paymentID: "<payment_id>",
    },
  },
};

type ApiWithBody = {
  [K in keyof FormState["payload"]]: FormState["payload"][K] extends {
    body: string;
  }
    ? K
    : never;
}[keyof FormState["payload"]];

export const Page: React.FC = () => {
  const [formState, dispatch] = useReducer(reducer, initialFormState);

  const mutation = useMutation((body: InvokeBody) =>
    fetch("/api/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((json) =>
        InvokeResult.is(json)
          ? Promise.resolve(json)
          : Promise.reject(new Error("Invalid response"))
      )
  );

  const handleApiChange: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (ev) =>
      pipe(
        ev.currentTarget.value,
        IO.fromPredicate(Api.is),
        IO.chainIOK(
          (api) => () => dispatch({ type: "change-api", payload: { api } })
        ),
        (effect) => effect()
      ),
    []
  );

  const handleSubmit: FormEventHandler = useCallback(
    (ev) => {
      ev.preventDefault();
      const data = match<FormState["api"], InvokeBody>(formState.api)
        .with("create-payment", () => ({
          api: "create-payment",
          body: JSON.parse(formState.payload["create-payment"].body),
        }))
        .with("get-payment-details", () => ({
          api: "get-payment-details",
          paymentID: formState.payload["get-payment-details"].paymentID,
        }))
        .exhaustive();
      mutation.mutate(data);
    },
    [formState, mutation]
  );

  const handleBodyChange = (api: ApiWithBody) => (value: string) => {
    match(api)
      .with("create-payment", () =>
        dispatch({
          type: "change-create-payment-body",
          payload: { body: value },
        })
      )
      .exhaustive();
  };

  return (
    <div className="w-full flex gap-4">
      <form className="w-1/2 flex flex-col gap-4" onSubmit={handleSubmit}>
        <h3 className="text-lg">Request</h3>
        <FormItem label="Select API">
          <Select
            className="block w-full"
            value={formState.api}
            onChange={handleApiChange}
          >
            <option value="create-payment">Create payment</option>
            <option value="get-payment-details">Get payment details</option>
          </Select>
        </FormItem>
        {match(formState)
          .with({ api: "create-payment" }, (formState) => (
            <BodyControls
              isDisabled={!isValid(formState)}
              value={formState.payload[formState.api].body}
              onChange={handleBodyChange(formState.api)}
            />
          ))
          .with({ api: "get-payment-details" }, (formState) => (
            <EntityIDControls
              label="Payment ID"
              value={formState.payload[formState.api].paymentID}
              onChange={(value) =>
                dispatch({
                  type: "change-get-payment-details-payment-id",
                  payload: { paymentID: value },
                })
              }
            />
          ))
          .exhaustive()}
        <Button disabled={!isValid(formState)} isLoading={mutation.isLoading}>
          Submit
        </Button>
      </form>
      <div className="w-1/2 flex flex-col gap-4">
        <h3 className="text-lg">Response</h3>
        {match(mutation)
          .with(
            { status: "idle" },
            { status: "loading" },
            { status: "error" },
            ({ status }) => (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-700 block">
                  {match(status)
                    .with("idle", () => "No data")
                    .with("loading", () => "Loading...")
                    .with("error", () => "Error. Please retry")
                    .exhaustive()}
                </span>
              </div>
            )
          )
          .with({ status: "success" }, ({ result }) => (
            <>
              <FormItem label="Status">
                <span className="block">{result.status}</span>
              </FormItem>
              <FormItem label="Headers">
                <span className="block">
                  <ul>
                    {result.headers.map(([key, value], index) => (
                      <li key={index}>
                        <span className="text-gray-700">{key}</span>:{" "}
                        <code>{value}</code>
                      </li>
                    ))}
                  </ul>
                </span>
              </FormItem>
              <FormItem label="Body">
                <pre className="block whitespace-pre-wrap bg-gray-100 p-4 rounded">
                  {pipe(
                    result.body,
                    J.parse,
                    E.map((json) => JSON.stringify(json, null, 2)),
                    E.getOrElse(() => result.body)
                  )}
                </pre>
              </FormItem>
            </>
          ))
          .exhaustive()}
      </div>
    </div>
  );
};
