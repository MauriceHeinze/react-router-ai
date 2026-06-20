import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PropsWithChildren,
} from "react";
import { AICommandRoot, useAICommand } from "./controller";
import type {
  AICommandConfirmationProps,
  AICommandDialogProps,
  AICommandEmptyProps,
  AICommandErrorProps,
  AICommandInputProps,
  AICommandItemProps,
  AICommandListProps,
  AICommandLoadingProps,
  AICommandVoiceButtonProps,
} from "./types";

export function AICommandDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: PropsWithChildren<AICommandDialogProps>) {
  const ctx = useAICommand();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    ctx.dialogRef.current = { open, setOpen };
    return () => {
      ctx.dialogRef.current = null;
    };
  }, [ctx.dialogRef, open, setOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Command palette">
      {children}
    </div>
  );
}

export function AICommandInput({
  placeholder,
  value: controlledValue,
  onValueChange,
  onKeyDown,
  onFocus,
  onBlur,
  autoFocus,
  className,
  style,
}: AICommandInputProps) {
  const ctx = useAICommand();
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : ctx.query;
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    if (!isControlled) {
      ctx.setQuery(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      ctx.setActiveIndex((current) => (current + 1) % Math.max(ctx.filteredItems.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      ctx.setActiveIndex(
        (current) =>
          (current - 1 + Math.max(ctx.filteredItems.length, 1)) %
          Math.max(ctx.filteredItems.length, 1),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = ctx.filteredItems[ctx.activeIndex];
      if (item) {
        void ctx.selectItem(item);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      ctx.closeDialog();
    }
    onKeyDown?.(event);
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      aria-label="Command query"
      className={className}
      style={style}
    />
  );
}

export function AICommandList({ children, className, style }: PropsWithChildren<AICommandListProps>) {
  return (
    <div role="listbox" aria-label="Commands" className={className} style={style}>
      {children}
    </div>
  );
}

export function AICommandItem({
  id,
  value,
  keywords,
  description,
  disabled,
  confirmation,
  onSelect,
  children,
  className,
  style,
}: PropsWithChildren<AICommandItemProps>) {
  const ctx = useAICommand();
  const itemRef = useRef({ id, value, keywords, description, disabled, confirmation, onSelect });
  itemRef.current = { id, value, keywords, description, disabled, confirmation, onSelect };

  useLayoutEffect(() => {
    return ctx.registerItem({ id, getItem: () => itemRef.current });
  }, [id, ctx.registerItem]);

  const index = ctx.filteredItems.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const isSelected = index === ctx.activeIndex;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={() => void ctx.selectItem(itemRef.current)}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

export function AICommandEmpty({ children, className, style }: PropsWithChildren<AICommandEmptyProps>) {
  const ctx = useAICommand();
  if (ctx.isSubmitting || ctx.filteredItems.length > 0) return null;
  return (
    <div role="status" className={className} style={style}>
      {children}
    </div>
  );
}

export function AICommandLoading({
  children,
  className,
  style,
}: PropsWithChildren<AICommandLoadingProps>) {
  const ctx = useAICommand();
  if (!ctx.isSubmitting) return null;
  return (
    <div role="status" aria-busy="true" className={className} style={style}>
      {children ?? "Loading..."}
    </div>
  );
}

export function AICommandError({ children, className, style }: AICommandErrorProps) {
  const ctx = useAICommand();
  if (!ctx.error) return null;
  return (
    <div role="alert" className={className} style={style}>
      {children ? children(ctx.error) : ctx.error}
    </div>
  );
}

export function AICommandVoiceButton({
  children,
  onClick,
  className,
  style,
}: PropsWithChildren<AICommandVoiceButtonProps>) {
  const ctx = useAICommand();

  return (
    <button
      type="button"
      aria-pressed={ctx.isListening}
      onClick={(event) => {
        onClick?.(event);
        if (ctx.isListening) {
          ctx.stopListening();
        } else {
          ctx.startListening();
        }
      }}
      className={className}
      style={style}
    >
      {children ?? (ctx.isListening ? "Listening..." : "Use voice")}
    </button>
  );
}

export function AICommandConfirmation({ className, style }: AICommandConfirmationProps) {
  const ctx = useAICommand();
  if (!ctx.pendingConfirmation) return null;

  const message =
    typeof ctx.pendingConfirmation.item.confirmation === "string"
      ? ctx.pendingConfirmation.item.confirmation
      : `Confirm "${ctx.pendingConfirmation.item.value}"?`;

  return (
    <div className={className} style={style}>
      <p style={{ margin: "0 0 10px" }}>{message}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => void ctx.confirmPending()}>
          Confirm
        </button>
        <button type="button" onClick={ctx.cancelPending}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export const AICommand = {
  Root: AICommandRoot,
  Dialog: AICommandDialog,
  Input: AICommandInput,
  List: AICommandList,
  Item: AICommandItem,
  Empty: AICommandEmpty,
  Loading: AICommandLoading,
  Error: AICommandError,
  VoiceButton: AICommandVoiceButton,
  Confirmation: AICommandConfirmation,
};
