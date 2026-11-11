"use client";

import type { ComponentProps } from "react";
import { DicesIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface PasswordInputProps extends Omit<ComponentProps<typeof InputGroupInput>, "type"> {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** Adds a button that fills in a generated password. */
  onGenerate?: () => void;
}

export function PasswordInput({ visible, onVisibleChange, onGenerate, ...props }: PasswordInputProps) {
  return (
    <InputGroup>
      <InputGroupInput
        type={visible ? "text" : "password"}
        spellCheck={false}
        autoCapitalize="off"
        className="font-mono"
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {onGenerate && (
          <InputGroupButton size="xs" onClick={onGenerate}>
            <DicesIcon />
            Generate
          </InputGroupButton>
        )}
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => onVisibleChange(!visible)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
