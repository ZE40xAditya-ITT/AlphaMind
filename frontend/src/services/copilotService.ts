import api from './api';

export const askCopilot = async (symbol: string, question: string): Promise<string> => {
  const response = await api.post('/copilot/ask', { symbol, question });
  return response.data.answer;
};
