export type TxQuery = {
  org_id: string;
  from?: string;
  to?: string;
  q?: string;
  status?: string[];
  account?: string[];
  category?: string[];
  method?: string[];
  tagsAny?: string[];
  tagsAll?: string[];
  min?: number;
  max?: number;
  orderBy?: "date" | "amount_cents" | "created_at";
  orderDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};
