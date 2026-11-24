interface Props {
  message?: string;
  id?: string;
}

function FormError({ message, id }: Props) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export default FormError;
