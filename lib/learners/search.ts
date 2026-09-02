export type LearnerSearchRow = {
  latin_first_name: string;
  latin_last_name: string;
  ukrainian_full_name: string;
  learner_emails: Array<{ email: string }> | null;
  learner_phones: Array<{ phone: string }> | null;
};

export function normalizeLearnerSearch(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}

export function learnerMatchesQuery(row: LearnerSearchRow, query: string): boolean {
  const needle = normalizeLearnerSearch(query);
  if (!needle) return true;

  const latinFullName = `${row.latin_first_name} ${row.latin_last_name}`;
  return [
    row.latin_first_name,
    row.latin_last_name,
    latinFullName,
    row.ukrainian_full_name,
    ...(row.learner_emails ?? []).map(({ email }) => email),
    ...(row.learner_phones ?? []).map(({ phone }) => phone),
  ].some((value) => normalizeLearnerSearch(value).includes(needle));
}
