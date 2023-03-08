import { Reducer, useCallback, useMemo, useReducer } from "react";
import { match } from "ts-pattern";

type MutationStateIdle = {
  status: "idle";
  isLoading: false;
  lastResult: undefined;
};

const MutationStateIdle: MutationStateIdle = {
  status: "idle",
  isLoading: false,
  lastResult: undefined,
};

type MutationStateLoading<TResult> = {
  status: "loading";
  isLoading: true;
  lastResult: undefined | TResult;
};

const MutationStateLoading: <TResult>(
  lastResult: TResult
) => MutationStateLoading<TResult> = (lastResult) => ({
  status: "loading",
  isLoading: true,
  lastResult,
});

type MutationStateSuccess<TResult> = {
  status: "success";
  isLoading: false;
  result: TResult;
  lastResult: TResult;
};

const MutationStateSuccess: <TResult>(
  result: TResult
) => MutationStateSuccess<TResult> = (result) => ({
  status: "success",
  isLoading: false,
  result,
  lastResult: result,
});

type MutationStateFailure<TResult, TError> = {
  status: "error";
  isLoading: false;
  lastResult: undefined | TResult;
  error: TError;
};

const MutationStateFailure: <TResult, TError>(
  error: TError,
  lastResult: undefined | TResult
) => MutationStateFailure<TResult, TError> = (error, lastResult) => ({
  status: "error",
  isLoading: false,
  error,
  lastResult,
});

type MutationState<TResult, TError> =
  | MutationStateIdle
  | MutationStateLoading<TResult>
  | MutationStateSuccess<TResult>
  | MutationStateFailure<TResult, TError>;

type ActionMutationStart = { type: "mutation-start" };

const ActionMutationStart: ActionMutationStart = { type: "mutation-start" };

type ActionMutationResult<TResult> = {
  type: "mutation-result";
  payload: { result: TResult };
};

const ActionMutationResult: <TResult>(
  result: TResult
) => ActionMutationResult<TResult> = (result) => ({
  type: "mutation-result",
  payload: { result },
});

type ActionMutationError<TError> = {
  type: "mutation-error";
  payload: { error: TError };
};

const ActionMutationError: <TError>(
  error: TError
) => ActionMutationError<TError> = (error) => ({
  type: "mutation-error",
  payload: { error },
});

type Action<TResult, TError> =
  | ActionMutationStart
  | ActionMutationResult<TResult>
  | ActionMutationError<TError>;

function getReducer<TResult, TError>(): Reducer<
  MutationState<TResult, TError>,
  Action<TResult, TError>
> {
  return (state, action) =>
    match(action)
      .with({ type: "mutation-start" }, () =>
        MutationStateLoading(state.lastResult)
      )
      .with({ type: "mutation-result" }, (action) =>
        MutationStateSuccess(action.payload.result)
      )
      .with({ type: "mutation-error" }, (action) =>
        MutationStateFailure(action.payload.error, state.lastResult)
      )
      .exhaustive();
}

type UseMutationReturn<TArgs extends any[], TResult, TError> = MutationState<
  TResult,
  TError
> & {
  mutate: (...args: TArgs) => unknown;
};

export function useMutation<TArgs extends any[], TResult, TError = unknown>(
  run: (...args: TArgs) => Promise<TResult>,
  options: {
    onSuccess?: (result: TResult) => void;
  } = {}
): UseMutationReturn<TArgs, TResult, TError> {
  const { onSuccess } = options;

  const initialState: MutationState<TResult, TError> = useMemo(
    () => MutationStateIdle,
    []
  );

  const [state, dispatch] = useReducer(
    getReducer<TResult, TError>(),
    initialState
  );

  const mutate = useCallback(
    (...args: TArgs) => {
      dispatch(ActionMutationStart);
      run(...args).then(
        (result) => {
          dispatch(ActionMutationResult(result));
          onSuccess?.(result);
        },
        (error) => dispatch(ActionMutationError(error))
      );
    },
    [onSuccess, run]
  );

  return useMemo(() => ({ ...state, mutate }), [state, mutate]);
}
