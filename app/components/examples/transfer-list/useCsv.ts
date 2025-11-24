export const useCsv = () => {
  const fromCsv = (csv: string, hasHeaders = true, separator = ',') => {
    const lines = csv.split(/\r?\n/).filter(Boolean);
    let headers: string[];
    let dataLines: string[];
    if (hasHeaders) {
      headers = lines[0]!.split(separator);
      dataLines = lines.slice(1);
    } else {
      const firstLineValues = lines[0]!.split(separator);
      headers = firstLineValues.map((_, i) => `col${i + 1}`);
      dataLines = lines;
    }
    const rows = dataLines.map((line) => {
      const values = line.split(separator);
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    return { rows, headers };
  };

  const toCsv = (data: Record<string, any>[], _hasHeaders = true, separator = ',') => {
    if (!data || data.length === 0 || !data[0]) return '';
    const headers = Object.keys(data[0]);
    const csvLines = data.map((item) => headers.map((header) => item[header]).join(separator));
    return [headers.join(separator), ...csvLines].join('\n');
  };

  return {
    fromCsv,
    toCsv,
  };
};
