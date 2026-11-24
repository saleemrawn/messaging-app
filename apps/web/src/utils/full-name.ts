interface PersonName {
  firstName: string;
  lastName: string;
}

function formatFullName({ firstName, lastName }: PersonName): string {
  return `${firstName} ${lastName}`;
}

export { formatFullName };
