import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { SportRecord } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SportSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showAllSports?: boolean; // If true, shows all sports including children. If false, only parent sports
  includeNoneOption?: boolean; // If true, includes "None" or "All sports" option
  noneOptionLabel?: string; // Label for the none option (default: "None")
  noneOptionValue?: string; // Value for the none option (default: "none")
}

export function SportSelect({
  value,
  onValueChange,
  placeholder = "Select sport...",
  disabled = false,
  className,
  showAllSports = true,
  includeNoneOption = false,
  noneOptionLabel = "None",
  noneOptionValue = "none",
}: SportSelectProps) {
  const [open, setOpen] = React.useState(false);

  const { data: sports = [], isLoading } = useQuery({
    queryKey: ["sports"],
    queryFn: api.listSports,
  });

  // Organize sports with parent and children
  const sportsWithChildren = React.useMemo(() => {
    const parentSports = sports.filter((sport) => !sport.parentId);
    return parentSports.map((parent) => ({
      parent,
      children: sports.filter((s) => s.parentId === parent.id),
    }));
  }, [sports]);

  // Get all sports for display (parent and children)
  const allSportsForDisplay = React.useMemo(() => {
    const result: Array<{ id: string; name: string; isChild: boolean; parentName?: string }> = [];
    sportsWithChildren.forEach(({ parent, children }) => {
      result.push({ id: parent.id, name: parent.name, isChild: false });
      if (showAllSports) {
        children.forEach((child) => {
          result.push({ id: child.id, name: child.name, isChild: true, parentName: parent.name });
        });
      }
    });
    return result;
  }, [sportsWithChildren, showAllSports]);

  const selectedSport = value === noneOptionValue 
    ? null 
    : allSportsForDisplay.find((s) => s.id === value);
  const displayValue = value === noneOptionValue
    ? noneOptionLabel
    : selectedSport
    ? selectedSport.isChild
      ? `${selectedSport.parentName} - ${selectedSport.name}`
      : selectedSport.name
    : placeholder;

  if (isLoading) {
    return <Skeleton className={cn("h-10 w-full", className)} />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {displayValue}
          <X className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search sports..." />
          <CommandList>
            <CommandEmpty>No sport found.</CommandEmpty>
            {includeNoneOption && (
              <CommandGroup>
                <CommandItem
                  value={noneOptionLabel}
                  onSelect={() => {
                    onValueChange(noneOptionValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === noneOptionValue ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {noneOptionLabel}
                </CommandItem>
              </CommandGroup>
            )}
            {showAllSports ? (
              // Show parent and children without group headings
              sportsWithChildren.map(({ parent, children }) => (
                <React.Fragment key={parent.id}>
                  <CommandItem
                    value={parent.name}
                    onSelect={() => {
                      onValueChange(parent.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === parent.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {parent.name}
                  </CommandItem>
                  {children.map((child) => (
                    <CommandItem
                      key={child.id}
                      value={`${parent.name} ${child.name}`}
                      onSelect={() => {
                        onValueChange(child.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === child.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="ml-4">{child.name}</span>
                    </CommandItem>
                  ))}
                </React.Fragment>
              ))
            ) : (
              // Show only parent sports
              sportsWithChildren.map(({ parent }) => (
                <CommandItem
                  key={parent.id}
                  value={parent.name}
                  onSelect={() => {
                    onValueChange(parent.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === parent.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {parent.name}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

