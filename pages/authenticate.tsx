import { useRouter } from "next/router";
import { useCallback } from "react";
import { Button } from "../components/button";
import { FormItem } from "../components/form-item";
import { Input } from "../components/input";
import { Select } from "../components/select";
import { useMutation } from "../modules/react";
import { AuthenticateBody } from "./api/authenticate";

const Authenticate: React.FC = (props) => {
  const router = useRouter();
  const mutation = useMutation(
    (body: AuthenticateBody) =>
      fetch("/api/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    { onSuccess: () => router.push("/") }
  );

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (ev) => {
      ev.preventDefault();
      mutation.mutate(
        AuthenticateBody.encode({
          env: ev.currentTarget.endpoint.value,
          activationCode: ev.currentTarget.code.value,
        })
      );
    },
    [mutation]
  );

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <div className="w-full flex flex-col gap-6">
        <FormItem label="Endpoint">
          <Select name="endpoint" className="block w-full">
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </Select>
        </FormItem>
        <FormItem label="Activation code">
          <Input type="text" autoFocus name="code" className="block w-full" />
        </FormItem>
        <Button className="mt-4" isLoading={mutation.isLoading}>
          Submit
        </Button>
      </div>
    </form>
  );
};

export default Authenticate;
