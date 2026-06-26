import type {
  ActionCommandResult,
  CommandSearchResult,
  ExecuteAICommandContext,
  NavigationCommandResult,
} from "./types";

function createNavigationHrefError(result: NavigationCommandResult) {
  return new Error(`Navigation command "${result.id}" must use an href starting with "/".`);
}

function resolveAction(
  result: ActionCommandResult,
  actions: ExecuteAICommandContext["actions"],
) {
  return actions[result.actionKey];
}

export async function executeAICommand(
  result: CommandSearchResult,
  context: ExecuteAICommandContext,
) {
  try {
    if (result.type === "navigation") {
      if (!result.href.startsWith("/")) {
        throw createNavigationHrefError(result);
      }

      if (context.routeExists && !context.routeExists(result.href)) {
        context.onUnknownRoute?.(result.href, result);
        return;
      }

      await context.navigate(result.href);
      return;
    }

    const action = resolveAction(result, context.actions);

    if (!action) {
      context.onUnknownAction?.(result.actionKey, result);
      return;
    }

    await action(context);
  } catch (error) {
    context.onExecuteError?.(error, result);
  }
}
