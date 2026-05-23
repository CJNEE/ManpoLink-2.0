export const polylineDecoder = (encoded: string): Array<[number, number]> => {
  const inv = 1.0 / 1e5;
  const decoded: Array<[number, number]> = [];
  const previous = [0, 0];
  let i = 0;

  while (i < encoded.length) {
    const ll = [0, 0];
    for (const j of [0, 1]) {
      let shift = 0;
      let result = 0;
      let byte = 0;

      do {
        byte = encoded.charCodeAt(i++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      ll[j] = previous[j] + (result & 1 ? ~(result >> 1) : result >> 1);
      previous[j] = ll[j];
    }
    decoded.push([ll[0] * inv, ll[1] * inv]);
  }

  return decoded;
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  if (!time) return 'N/A';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatDateTime = (datetime: string): string => {
  const date = new Date(datetime);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const capitalizeString = (str: string): string => {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'Active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Resign': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'AWOL': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Blacklist': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Present': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Late': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Absent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};
