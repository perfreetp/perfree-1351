export const formatPrice = (price: number): string => {
  if (price === 0) return '待定';
  return `¥${price.toLocaleString()}`;
};

export const formatDate = (date: string): string => {
  if (!date) return '';
  return date;
};

export const getDaysUntil = (date: string): number => {
  const today = new Date();
  const target = new Date(date);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDaysSince = (date: string): number => {
  const today = new Date();
  const target = new Date(date);
  const diff = today.getTime() - target.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getMaintenanceTypeText = (type: string): string => {
  const map: Record<string, string> = {
    dust: '除尘保养',
    light_protection: '避光检查',
    other: '其他维护'
  };
  return map[type] || type;
};

export const getFlawStatusText = (status: string): string => {
  return status === 'pending' ? '待处理' : '已解决';
};

export const getPartStatusText = (status: string): string => {
  return status === 'pending' ? '待补发' : '已收到';
};
