import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { REHYDRATE } from 'redux-persist';
import { API_URL } from '@/lib/config';
import { getToken, clearToken } from '@/lib/secureToken';
import type {
  ApiResponse,
  AuthData,
  Category,
  Expense,
  CreateExpensePayload,
  RecurringTemplate,
  CreateRecurringPayload,
  Income,
  CreateIncomePayload,
  RecurringIncomeTemplate,
  CreateRecurringIncomePayload,
  AnalyticsSummary,
} from '@/types';

// Ham baseQuery: token enjekte eder.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  prepareHeaders: async (headers) => {
    const token = await getToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// { success, data, message } zarfını açar; success:false'u hataya çevirir; 401'de token siler.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  apiArg,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, apiArg, extraOptions);

  if (result.error) {
    if (result.error.status === 401) await clearToken();
    return result;
  }

  const body = result.data as ApiResponse<unknown>;
  if (body && body.success === false) {
    return { error: { status: 400, data: body.message ?? 'Hata' } as FetchBaseQueryError };
  }
  return { data: body?.data };
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  // Offline cache: redux-persist REHYDRATE'inde saklı RTK Query cache'ini geri yükle.
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return (action as { payload?: Record<string, unknown> }).payload?.[reducerPath] as never;
    }
    return undefined;
  },
  tagTypes: ['Category', 'Expense', 'Recurring', 'Income', 'RecurringIncome', 'Analytics'],
  endpoints: (build) => ({
    // --- Auth ---
    login: build.mutation<AuthData, { username: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: build.mutation<AuthData, { username: string; password: string; display_name?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    // --- Categories ---
    getCategories: build.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),

    // --- Expenses ---
    getExpenses: build.query<Expense[], { year: number; month?: number }>({
      query: ({ year, month }) => `/expenses?year=${year}${month ? `&month=${month}` : ''}`,
      providesTags: ['Expense'],
    }),
    createExpense: build.mutation<Expense, CreateExpensePayload>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: ['Expense', 'Analytics'],
    }),
    updateExpense: build.mutation<Expense, { id: number; body: CreateExpensePayload }>({
      query: ({ id, body }) => ({ url: `/expenses/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Expense', 'Analytics'],
    }),
    deleteExpense: build.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Expense', 'Analytics'],
    }),

    // --- Recurring templates ---
    getRecurring: build.query<RecurringTemplate[], void>({
      query: () => '/recurring',
      providesTags: ['Recurring'],
    }),
    createRecurring: build.mutation<RecurringTemplate, CreateRecurringPayload>({
      query: (body) => ({ url: '/recurring', method: 'POST', body }),
      invalidatesTags: ['Recurring', 'Expense', 'Analytics'],
    }),
    updateRecurring: build.mutation<RecurringTemplate, { id: number; body: Partial<CreateRecurringPayload> & { active?: boolean } }>({
      query: ({ id, body }) => ({ url: `/recurring/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Recurring', 'Expense', 'Analytics'],
    }),
    deleteRecurring: build.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/recurring/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Recurring', 'Expense', 'Analytics'],
    }),

    // --- Incomes ---
    getIncomes: build.query<Income[], { year: number; month?: number }>({
      query: ({ year, month }) => `/incomes?year=${year}${month ? `&month=${month}` : ''}`,
      providesTags: ['Income'],
    }),
    createIncome: build.mutation<Income, CreateIncomePayload>({
      query: (body) => ({ url: '/incomes', method: 'POST', body }),
      invalidatesTags: ['Income', 'Analytics'],
    }),
    updateIncome: build.mutation<Income, { id: number; body: Partial<CreateIncomePayload> }>({
      query: ({ id, body }) => ({ url: `/incomes/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Income', 'Analytics'],
    }),
    deleteIncome: build.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/incomes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Income', 'Analytics'],
    }),

    // --- Recurring incomes ---
    getRecurringIncomes: build.query<RecurringIncomeTemplate[], void>({
      query: () => '/recurring-incomes',
      providesTags: ['RecurringIncome'],
    }),
    createRecurringIncome: build.mutation<RecurringIncomeTemplate, CreateRecurringIncomePayload>({
      query: (body) => ({ url: '/recurring-incomes', method: 'POST', body }),
      invalidatesTags: ['RecurringIncome', 'Income', 'Analytics'],
    }),
    updateRecurringIncome: build.mutation<RecurringIncomeTemplate, { id: number; body: Partial<CreateRecurringIncomePayload> & { active?: boolean } }>({
      query: ({ id, body }) => ({ url: `/recurring-incomes/${id}`, method: 'PUT', body }),
      invalidatesTags: ['RecurringIncome', 'Income', 'Analytics'],
    }),
    deleteRecurringIncome: build.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/recurring-incomes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['RecurringIncome', 'Income', 'Analytics'],
    }),

    // --- Analytics ---
    getAnalytics: build.query<AnalyticsSummary, number>({
      query: (year) => `/analytics?year=${year}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCategoriesQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetRecurringQuery,
  useCreateRecurringMutation,
  useUpdateRecurringMutation,
  useDeleteRecurringMutation,
  useGetIncomesQuery,
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
  useGetRecurringIncomesQuery,
  useCreateRecurringIncomeMutation,
  useUpdateRecurringIncomeMutation,
  useDeleteRecurringIncomeMutation,
  useGetAnalyticsQuery,
} = api;
