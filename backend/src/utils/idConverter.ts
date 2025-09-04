export function formatRefId(id: number, prefix = "REF", zeros = 6): string {
    return `${prefix}${id.toString().padStart(zeros, "0")}`;
}