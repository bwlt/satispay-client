import { either, json } from "fp-ts";
import { Predicate } from "fp-ts/Predicate";
import { flow, pipe } from "fp-ts/function";
import { FormEventHandler, useCallback, useReducer } from "react";
import { match } from "ts-pattern";
import * as fromDate from "../../../helpers/date";
import { useMutation } from "../../../modules/react";
import { InvokeBody, InvokeResult } from "../../../pages/api/invoke";
import { Button } from "../../button";
import { FormItem } from "../../form-item";
import { Api } from "./Api";
import { ApiSelect } from "./api-select";
import { BodyControls } from "./body-controls";
import { EntityIDControls } from "./entity-id-controls";
import { RetrieveDailyClosureControls } from "./retrieve-daily-closure-controls";

export type FormState = {
  api: Api;
  payload: {
    "create-payment": {
      body: string;
    };
    "update-payment": {
      entityID: string;
      body: string;
    };
    "get-payment-details": {
      entityID: string;
    };
    "create-authorization": {
      body: string;
    };
    "retrieve-daily-closure": {
      date: Date;
      generatePdf: boolean;
    };
  };
};

type ApiWithBody = {
  [K in keyof FormState["payload"]]: FormState["payload"][K] extends {
    body: string;
  }
    ? K
    : never;
}[keyof FormState["payload"]];

type ApiWithEntityID = {
  [K in keyof FormState["payload"]]: FormState["payload"][K] extends {
    entityID: string;
  }
    ? K
    : never;
}[keyof FormState["payload"]];

type Action =
  | { type: "change-api"; payload: { api: Api } }
  | {
      type: "change-body";
      payload: {
        api: ApiWithBody;
        body: string;
      };
    }
  | {
      type: "change-entity-id";
      payload: { api: ApiWithEntityID; entityID: string };
    }
  | {
      type: "change-payload";
      payload: ChangePayloadActionPayload;
    };

type ChangePayloadActionPayload<
  Api extends keyof FormState["payload"] = keyof FormState["payload"]
> = {
  api: Api;
  payload: FormState["payload"][Api];
};

function reducer(state: FormState, action: Action): FormState {
  return match<Action, FormState>(action)
    .with({ type: "change-api" }, (action) => ({
      api: action.payload.api,
      payload: state.payload,
    }))
    .with({ type: "change-body" }, (action) => ({
      api: state.api,
      payload: {
        ...state.payload,
        [action.payload.api]: {
          ...state.payload[action.payload.api],
          body: action.payload.body,
        },
      },
    }))
    .with({ type: "change-entity-id" }, (action) => ({
      api: state.api,
      payload: {
        ...state.payload,
        [action.payload.api]: {
          ...state.payload[action.payload.api],
          entityID: action.payload.entityID,
        },
      } satisfies FormState["payload"],
    }))
    .with({ type: "change-payload" }, (action) => ({
      ...state,
      payload: {
        ...state.payload,
        [action.payload.api]: action.payload.payload,
      },
    }))
    .exhaustive();
}

const isValid: Predicate<FormState> = (formState) => {
  const isValidBody: Predicate<string> = flow(json.parse, either.isRight);
  const isValidEntityId: Predicate<string> = (s) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  return match(formState)
    .with(
      { api: "create-payment" },
      { api: "create-authorization" },
      ({ api, payload }) => isValidBody(payload[api].body)
    )
    .with(
      { api: "update-payment" },
      ({ api, payload }) =>
        isValidBody(payload[api].body) && isValidEntityId(payload[api].entityID)
    )
    .with({ api: "get-payment-details" }, ({ api, payload }) =>
      isValidEntityId(payload[api].entityID)
    )
    .with(
      { api: "get-list-of-payments" },
      // no validation to perform
      () => true
    )
    .with(
      {
        api: "retrieve-daily-closure",
      },
      ({ payload }) => fromDate.isValid(payload["retrieve-daily-closure"].date)
    )
    .exhaustive();
};

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
      entityID: "<payment_id>",
    },
    "update-payment": {
      entityID: "<payment_id>",
      body: JSON.stringify(
        {
          action: "ACCEPT",
          metadata: {},
        },
        null,
        2
      ),
    },
    "create-authorization": {
      body: JSON.stringify(
        {
          reason: "",
          callback_url: "",
          redirect_url: "",
          metadata: {},
        },
        null,
        2
      ),
    },
    "retrieve-daily-closure": {
      date: new Date(),
      generatePdf: true,
    },
  },
};

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

  const handleApiChange = useCallback(
    (api: Api) => dispatch({ type: "change-api", payload: { api } }),
    []
  );

  const handleSubmit: FormEventHandler = useCallback(
    (ev) => {
      ev.preventDefault();
      const data = match<FormState["api"], InvokeBody>(formState.api)
        .with("create-payment", "create-authorization", (api) => ({
          api,
          body: JSON.parse(formState.payload[api].body),
        }))
        .with("get-payment-details", () => ({
          api: "get-payment-details",
          entityID: formState.payload["get-payment-details"].entityID,
        }))
        .with("update-payment", () => ({
          api: "update-payment",
          entityID: formState.payload["update-payment"].entityID,
          body: JSON.parse(formState.payload["update-payment"].body),
        }))
        .with("get-list-of-payments", () => ({
          api: "get-list-of-payments",
        }))
        .with("retrieve-daily-closure", () => ({
          api: "retrieve-daily-closure",
          dailyClosureDate: fromDate.format(
            "yyyyMMdd",
            formState.payload["retrieve-daily-closure"].date
          ),
          generatePdf: formState.payload["retrieve-daily-closure"].generatePdf,
        }))
        .exhaustive();
      mutation.mutate(data);
    },
    [formState, mutation]
  );

  const handleEntityIDChange = (api: ApiWithEntityID) => (value: string) =>
    dispatch({
      type: "change-entity-id",
      payload: { api, entityID: value },
    });

  const handleBodyChange = (api: ApiWithBody) => (value: string) =>
    dispatch({
      type: "change-body",
      payload: { api, body: value },
    });

  const handleRetrieveDailyClosureControlsChange = (
    data: FormState["payload"]["retrieve-daily-closure"]
  ) =>
    dispatch({
      type: "change-payload",
      payload: { api: "retrieve-daily-closure", payload: data },
    });

  return (
    <div className="w-full flex gap-4">
      <form className="w-1/2 flex flex-col gap-4" onSubmit={handleSubmit}>
        <h3 className="text-lg">Request</h3>
        <FormItem label="Select API">
          <ApiSelect value={formState.api} onChange={handleApiChange} />
        </FormItem>
        {match(formState.api)
          .with("get-payment-details", "update-payment", (api) => (
            <EntityIDControls
              label="Entity ID"
              value={formState.payload[api].entityID}
              onChange={handleEntityIDChange(api)}
            />
          ))
          .otherwise(() => null)}
        {match(formState.api)
          .with(
            "create-payment",
            "create-authorization",
            "update-payment",
            (api) => (
              <BodyControls
                isDisabled={!isValid(formState)}
                value={formState.payload[api].body}
                onChange={handleBodyChange(api)}
              />
            )
          )
          .with("retrieve-daily-closure", (api) => (
            <RetrieveDailyClosureControls
              value={formState.payload[api]}
              onChange={handleRetrieveDailyClosureControlsChange}
            />
          ))
          .otherwise(() => null)}
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
                    json.parse,
                    either.map((json) => JSON.stringify(json, null, 2)),
                    either.getOrElse(() => result.body)
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
