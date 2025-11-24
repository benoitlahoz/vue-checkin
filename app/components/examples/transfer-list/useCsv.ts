export const useCsv = () => {
  const parse = (csv: string) => {
    const lines = csv.split(/\r?\n/).filter(Boolean);
    const headers = lines[0]!.split(',');
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    return { rows };
  };

  return {
    parse,
  };
};
