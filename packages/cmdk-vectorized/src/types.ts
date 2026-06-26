export type NavigationCommandResult = {
  id: string;
  type: "navigation";
  title: string;
  description?: string;
  href: string;
  score?: number;
  meta?: Record<string, unknown>;
};

export type ActionCommandResult = {
  id: string;
  type: "action";
  title: string;
  description?: string;
  actionKey: string;
  score?: number;
  meta?: Record<string, unknown>;
};

export type CommandSearchResult = NavigationCommandResult | ActionCommandResult;

export type CommandSearchResponse = {
  results: CommandSearchResult[];
};

export type UseAICommandSearchOptions = {
  endpoint: string;
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  headers?: HeadersInit;
  fetcher?: typeof fetch;
  transformResponse?: (data: unknown) => CommandSearchResult[];
  initialResults?: CommandSearchResult[];
  searchOnEmptyQuery?: boolean;
};

export type UseAICommandSearchResult = {
  query: string;
  setQuery: (query: string) => void;
  results: CommandSearchResult[];
  loading: boolean;
  error: Error | null;
  clear: () => void;
  refetch: () => Promise<void>;
};

export type ExecuteAICommandContext = {
  navigate: (href: string) => void | Promise<void>;
  actions?: Record<string, (ctx: ExecuteAICommandContext) => void | Promise<void>>;
  routeExists?: (href: string) => boolean;
  onUnknownAction?: (actionKey: string, result: ActionCommandResult) => void;
  onUnknownRoute?: (href: string, result: NavigationCommandResult) => void;
  onExecuteError?: (error: unknown, result: CommandSearchResult) => void;
};

export type UseAICommandOptions = UseAICommandSearchOptions & ExecuteAICommandContext;

export type UseAICommandResult = UseAICommandSearchResult & {
  execute: (result: CommandSearchResult) => Promise<void>;
};

export type CreateCommandSearchHandlerOptions = {
  search: (params: {
    query: string;
    limit: number;
    request: Request;
  }) => Promise<CommandSearchResult[]>;
  defaultLimit?: number;
  maxLimit?: number;
};
