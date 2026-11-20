// Turns a failed request into a short Swedish message for the user. ApiClient throws errors with
// `status` (HTTP status, or 0 when the server could not be reached at all)

export const NETWORK_ERROR = 0;

export function errorStatus(err: unknown): number | undefined {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

function reason(status: number | undefined): string {
  switch (status) {
    case NETWORK_ERROR:
      return 'Servern gick inte att nå. Kontrollera anslutningen och försök igen.';
    case 400:
      return 'Uppgifterna godtogs inte. Kontrollera datum och mängd.';
    case 403:
      return 'Åtgärden nekades. Ladda om sidan och försök igen.';
    case 404:
      return 'Den finns inte längre.';
    case 502:
      return 'SMHI svarar inte just nu. Försök igen senare.';
    default:
      return 'Något gick fel på servern. Försök igen.';
  }
}

/** E.g. errorMessage(err, 'spara förbrukningen') → "Kunde inte spara förbrukningen. Servern gick inte …" */
export function errorMessage(err: unknown, action: string): string {
  return `Kunde inte ${action}. ${reason(errorStatus(err))}`;
}
