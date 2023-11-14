"use client";

import scrollbar_style from "../../styles/scrollbar.module.css";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { DateRangePicker } from "react-date-range";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "./checkbox";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Check,
  Filter,
  Maximize2,
  PlusCircle,
  X,
  XCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import React, { StrictMode, useCallback, useEffect, useState } from "react";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";
import format from "date-fns/format";
import { TimeFilterType, removeCharNotANum } from "@/utils";

const ChoicesFilter = ({
  title,
  isSingleChoice,
  showPlusButton,
  alwaysOpen,
  choices,
  className,
  defaultValue,
  defaultValues = [],
  onPlusButtonClicked,
  onSingleChoiceChanged,
  onMultiChoicesChanged,
}: {
  title: string;
  isSingleChoice: boolean;
  showPlusButton?: boolean;
  alwaysOpen?: boolean;
  choices: string[];
  className?: string;
  defaultValue?: string;
  defaultValues?: string[];
  onPlusButtonClicked?: () => void;
  onSingleChoiceChanged?: (value: string) => void;
  onMultiChoicesChanged?: (values: string[]) => void;
}) => {
  const multiChoicesHandler = (
    checkedState: boolean | "indeterminate",
    checkedValue: string
  ) => {
    if (checkedState === true) {
      if (!defaultValues.includes(checkedValue))
        defaultValues.push(checkedValue);
    } else {
      const removePos = defaultValues.indexOf(checkedValue);
      if (removePos != -1) defaultValues.splice(removePos, 1);
    }

    if (onMultiChoicesChanged) onMultiChoicesChanged(defaultValues);
  };

  return (
    <Accordion
      type="single"
      collapsible={!alwaysOpen}
      defaultValue="item-1"
      className={cn("w-full bg-white rounded-md px-4", className)}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger showArrowFunc={alwaysOpen ? "hidden" : ""}>
          <div className="flex flex-row items-center w-full">
            <p className="text-[0.8rem] leading-4 font-bold text-start flex-1">
              {title}
            </p>
            {showPlusButton === true ? (
              <PlusCircle
                className={alwaysOpen ? "ml-2" : "mx-2"}
                size={16}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPlusButtonClicked) onPlusButtonClicked();
                }}
              />
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {isSingleChoice ? (
            <RadioGroup
              className="gap-3 pb-2"
              defaultValue={defaultValue}
              onValueChange={(val) => {
                if (onSingleChoiceChanged) onSingleChoiceChanged(val);
              }}
            >
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={choice} id={title + index} />
                  <Label
                    htmlFor={title + index}
                    className="text-[0.8rem] hover:cursor-pointer font-normal"
                  >
                    {choice}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="flex flex-col gap-3 pb-2">
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    value={index}
                    id={title + index}
                    checked={defaultValues!.includes(choice)}
                    onCheckedChange={(checkedState) =>
                      multiChoicesHandler(checkedState, choice)
                    }
                  />
                  <Label
                    htmlFor={title + index}
                    className="text-[0.8rem] hover:cursor-pointer font-normal"
                  >
                    {choice}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

enum FilterDay {
  Today = "Today",
  LastDay = "Last day",
}

enum FilterWeek {
  ThisWeek = "This week",
  LastWeek = "Last week",
  Last7Days = "Last 7 days",
}

enum FilterMonth {
  ThisMonth = "This month",
  LastMonth = "Last month",
  Last30Days = "Last 30 days",
}

enum FilterQuarter {
  ThisQuarter = "This quarter",
  LastQuarter = "Last quarter",
}

enum FilterYear {
  ThisYear = "This year",
  LastYear = "Last year",
  AllTime = "All time",
}

export type FilterTime =
  | FilterDay
  | FilterWeek
  | FilterMonth
  | FilterQuarter
  | FilterYear;

const TimerFilterRangePicker = ({
  defaultValue,
  onValueChange,
  setIsRangeFilterOpen,
}: {
  defaultValue: { startDate: Date; endDate: Date };
  onValueChange?: (val: { startDate: Date; endDate: Date }) => void;
  setIsRangeFilterOpen: (val: boolean) => void;
}) => {
  const [tempRange, setTempRange] = useState(defaultValue);

  return (
    <>
      <DateRangePicker
        ranges={[{ ...tempRange, key: "selection" }]}
        onChange={(item) => {
          if (
            item.selection.startDate &&
            item.selection.endDate &&
            item.selection.key
          ) {
            setTempRange({
              startDate: item.selection.startDate,
              endDate: item.selection.endDate,
            });
          }
        }}
      />
      <Button
        className="bg-blue-400 hover:bg-blue-500 text-white mt-2"
        onClick={(e) => {
          e.stopPropagation();
          if (onValueChange) onValueChange(tempRange);
          setIsRangeFilterOpen(false);
        }}
      >
        Done
      </Button>
    </>
  );
};

const TimeFilter = ({
  title,
  className,
  alwaysOpen = false,
  timeFilterControl = TimeFilterType.StaticRange,
  singleTimeValue = FilterYear.AllTime,
  singleTimeString,
  rangeTimeValue = { startDate: new Date(), endDate: new Date() },
  filterDay = [FilterDay.Today, FilterDay.LastDay],
  filterWeek = [FilterWeek.ThisWeek, FilterWeek.LastWeek, FilterWeek.Last7Days],
  filterMonth = [
    FilterMonth.ThisMonth,
    FilterMonth.LastMonth,
    FilterMonth.Last30Days,
  ],
  filterQuarter = [FilterQuarter.ThisQuarter, FilterQuarter.LastQuarter],
  filterYear = [FilterYear.ThisYear, FilterYear.LastYear, FilterYear.AllTime],
  onTimeFilterControlChanged,
  onSingleTimeFilterChanged,
  onRangeTimeFilterChanged,
}: {
  title: string;
  className?: string;
  alwaysOpen?: boolean;
  timeFilterControl: TimeFilterType;
  singleTimeValue?: FilterTime;
  singleTimeString?: string;
  rangeTimeValue?: { startDate: Date; endDate: Date };
  filterDay?: FilterDay[];
  filterWeek?: FilterWeek[];
  filterMonth?: FilterMonth[];
  filterQuarter?: FilterQuarter[];
  filterYear?: FilterYear[];
  onTimeFilterControlChanged: (timeFilterControl: TimeFilterType) => void;
  onSingleTimeFilterChanged?: (filterTime: FilterTime) => void;
  onRangeTimeFilterChanged?: (range: {
    startDate: Date;
    endDate: Date;
  }) => void;
}) => {
  const [isSingleFilter, setIsSingleFilter] = useState(
    timeFilterControl === TimeFilterType.StaticRange
  );
  const [isRangeFilterOpen, setIsRangeFilterOpen] = useState(false);

  useEffect(() => {
    onTimeFilterControlChanged(
      isSingleFilter ? TimeFilterType.StaticRange : TimeFilterType.RangeTime
    );
  }, [isSingleFilter]);

  return (
    <Accordion
      type="single"
      collapsible={!alwaysOpen}
      defaultValue="item-1"
      className={cn("w-full bg-white rounded-md px-4", className)}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger showArrowFunc={alwaysOpen ? "hidden" : ""}>
          <div className="flex flex-row items-center w-full">
            <p className="text-[0.8rem] leading-4 font-bold text-start flex-1">
              {title}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <RadioGroup className="gap-3 pb-2">
            <div className="flex flex-row items-center space-x-3 border border-gray-300 p-2 rounded-sm relative">
              <RadioGroupItem
                value="1"
                id={title + "1"}
                checked={isSingleFilter}
                onClick={() => {
                  if (isSingleFilter) return;
                  setIsSingleFilter(true);
                  if (onSingleTimeFilterChanged)
                    onSingleTimeFilterChanged(singleTimeValue);
                }}
              />
              <Label
                htmlFor={title + "1"}
                className="text-[0.8rem] flex-1 hover:cursor-pointer font-normal"
              >
                {singleTimeString ? singleTimeString : singleTimeValue}
              </Label>
              <Popover>
                <PopoverTrigger>
                  <Maximize2 size={16} />
                </PopoverTrigger>
                <PopoverContent className="flex flex-row gap-6 w-auto -translate-x-4">
                  <div>
                    <p className="text-xs font-semibold">By day</p>
                    <ul className="list-none text-blue-500 text-xs">
                      {filterDay.map((val, idx) => (
                        <li
                          className="mt-5 cursor-pointer"
                          onClick={() => {
                            setIsSingleFilter(true);
                            if (onSingleTimeFilterChanged)
                              onSingleTimeFilterChanged(val);
                          }}
                          key={idx}
                        >
                          {val}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">By week</p>
                    <ul className="list-none text-blue-500 text-xs">
                      {filterWeek.map((val, idx) => (
                        <li
                          className="mt-5 cursor-pointer"
                          onClick={() => {
                            setIsSingleFilter(true);
                            if (onSingleTimeFilterChanged)
                              onSingleTimeFilterChanged(val);
                          }}
                          key={idx}
                        >
                          {val}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">By month</p>
                    <ul className="list-none text-blue-500 text-xs">
                      {filterMonth.map((val, idx) => (
                        <li
                          className="mt-5 cursor-pointer"
                          onClick={() => {
                            setIsSingleFilter(true);
                            if (onSingleTimeFilterChanged)
                              onSingleTimeFilterChanged(val);
                          }}
                          key={idx}
                        >
                          {val}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">By quarter</p>
                    <ul className="list-none text-blue-500 text-xs">
                      {filterQuarter.map((val, idx) => (
                        <li
                          className="mt-5 cursor-pointer"
                          onClick={() => {
                            setIsSingleFilter(true);
                            if (onSingleTimeFilterChanged)
                              onSingleTimeFilterChanged(val);
                          }}
                          key={idx}
                        >
                          {val}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">By year</p>
                    <ul className="list-none text-blue-500 text-xs">
                      {filterYear.map((val, idx) => (
                        <li
                          className="mt-5 cursor-pointer"
                          onClick={() => {
                            setIsSingleFilter(true);
                            if (onSingleTimeFilterChanged)
                              onSingleTimeFilterChanged(val);
                          }}
                          key={idx}
                        >
                          {val}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-row items-center space-x-3 border border-gray-300 p-2 rounded-sm">
              <RadioGroupItem
                value="2"
                id={title + "2"}
                checked={!isSingleFilter}
                onClick={() => {
                  setIsSingleFilter(false);
                  if (onRangeTimeFilterChanged)
                    onRangeTimeFilterChanged(rangeTimeValue);
                }}
              />
              <Label
                htmlFor={title + "2"}
                className="text-[0.8rem] flex-1 hover:cursor-pointer font-normal"
              >
                {format(rangeTimeValue.startDate, "dd/MM/yyyy") +
                  " - " +
                  format(rangeTimeValue.endDate, "dd/MM/yyyy")}
              </Label>
              <Popover
                open={isRangeFilterOpen}
                onOpenChange={setIsRangeFilterOpen}
              >
                <PopoverTrigger>
                  <CalendarDays size={16} />
                </PopoverTrigger>
                <PopoverContent className="w-auto -translate-x-4 flex flex-col">
                  <TimerFilterRangePicker
                    defaultValue={rangeTimeValue}
                    onValueChange={onRangeTimeFilterChanged}
                    setIsRangeFilterOpen={setIsRangeFilterOpen}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export enum FilterGroup {
  ByYear = "By year",
  ByQuarter = "By quarter",
  ByMonth = "By month",
}
const SecondaryTimeFilter = ({
  title,
  className,
  alwaysOpen = false,
  timeFilterControl = TimeFilterType.StaticRange,
  singleTimeValue = FilterGroup.ByMonth,
  singleTimeString,
  rangeTimeValue = { startDate: new Date(), endDate: new Date() },
  filterGroup = [
    FilterGroup.ByYear,
    FilterGroup.ByQuarter,
    FilterGroup.ByMonth,
  ],
  onTimeFilterControlChanged,
  onSingleTimeFilterChanged,
  onRangeTimeFilterChanged,
}: {
  title: string;
  className?: string;
  alwaysOpen?: boolean;
  timeFilterControl: TimeFilterType;
  singleTimeValue?: FilterGroup;
  singleTimeString?: string;
  rangeTimeValue?: { startDate: Date; endDate: Date };
  filterGroup?: FilterGroup[];
  onTimeFilterControlChanged: (timeFilterControl: TimeFilterType) => void;
  onSingleTimeFilterChanged?: (filterGroup: FilterGroup) => void;
  onRangeTimeFilterChanged?: (range: {
    startDate: Date;
    endDate: Date;
  }) => void;
}) => {
  const [isSingleFilter, setIsSingleFilter] = useState(
    timeFilterControl === TimeFilterType.StaticRange
  );
  const [isRangeFilterOpen, setIsRangeFilterOpen] = useState(false);

  useEffect(() => {
    onTimeFilterControlChanged(
      isSingleFilter ? TimeFilterType.StaticRange : TimeFilterType.RangeTime
    );
  }, [isSingleFilter]);

  return (
    <Accordion
      type="single"
      collapsible={!alwaysOpen}
      defaultValue="item-1"
      className={cn("w-full bg-white rounded-md px-4", className)}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger showArrowFunc={alwaysOpen ? "hidden" : ""}>
          <div className="flex flex-row items-center w-full">
            <p className="text-[0.8rem] leading-4 font-bold text-start flex-1">
              {title}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <RadioGroup className="gap-3 pb-2">
            <div className="flex flex-row items-center space-x-3 border border-gray-300 p-2 rounded-sm relative">
              <RadioGroupItem
                value="1"
                id={title + "1"}
                checked={isSingleFilter}
                onClick={() => {
                  if (isSingleFilter) return;
                  setIsSingleFilter(true);
                  if (onSingleTimeFilterChanged)
                    onSingleTimeFilterChanged(singleTimeValue);
                }}
              />
              <Label
                htmlFor={title + "1"}
                className="text-[0.8rem] flex-1 hover:cursor-pointer font-normal"
              >
                {singleTimeString ? singleTimeString : singleTimeValue}
              </Label>
              <Popover>
                <PopoverTrigger>
                  <Maximize2 size={16} />
                </PopoverTrigger>
                <PopoverContent className="flex flex-row gap-6 w-auto -translate-x-4">
                  <div>
                    <p className="text-xs font-semibold">By day</p>
                    <ul className="list-none text-blue-500 text-xs">
                      {filterGroup.map((val, idx) => (
                        <li
                          className="mt-5 cursor-pointer"
                          onClick={() => {
                            setIsSingleFilter(true);
                            if (onSingleTimeFilterChanged)
                              onSingleTimeFilterChanged(val);
                          }}
                          key={idx}
                        >
                          {val}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-row items-center space-x-3 border border-gray-300 p-2 rounded-sm">
              <RadioGroupItem
                value="2"
                id={title + "2"}
                checked={!isSingleFilter}
                onClick={() => {
                  setIsSingleFilter(false);
                  if (onRangeTimeFilterChanged)
                    onRangeTimeFilterChanged(rangeTimeValue);
                }}
              />
              <Label
                htmlFor={title + "2"}
                className="text-[0.8rem] flex-1 hover:cursor-pointer font-normal"
              >
                {format(rangeTimeValue.startDate, "dd/MM/yyyy") +
                  " - " +
                  format(rangeTimeValue.endDate, "dd/MM/yyyy")}
              </Label>
              <Popover
                open={isRangeFilterOpen}
                onOpenChange={setIsRangeFilterOpen}
              >
                <PopoverTrigger>
                  <CalendarDays size={16} />
                </PopoverTrigger>
                <PopoverContent className="w-auto -translate-x-4 flex flex-col">
                  <TimerFilterRangePicker
                    defaultValue={rangeTimeValue}
                    onValueChange={onRangeTimeFilterChanged}
                    setIsRangeFilterOpen={setIsRangeFilterOpen}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const SearchFilter = ({
  title,
  placeholder,
  alwaysOpen,
  chosenValues,
  choices,
  className,
  onValuesChanged,
}: {
  title: string;
  placeholder: string;
  alwaysOpen?: boolean;
  chosenValues: string[];
  choices: string[];
  className?: string;
  onValuesChanged?: (values: string[]) => void;
}) => {
  const [showSearchValue, setShowSearchvalue] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (onValuesChanged) onValuesChanged(chosenValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenValues]);

  return (
    <Accordion
      type="single"
      collapsible={!alwaysOpen}
      defaultValue="item-1"
      className={cn("w-full bg-white rounded-md px-4", className)}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger showArrowFunc={alwaysOpen ? "hidden" : ""}>
          <div className="flex flex-row items-center w-full">
            <p className="text-[0.8rem] leading-4 font-bold text-start flex-1">
              {title}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="overflow-hidden data-[state=open]:overflow-visible">
          <div className="flex flex-col mb-4 relative">
            <Input
              className="w-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
              placeholder={placeholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setShowSearchvalue(true)}
              onBlur={() => setShowSearchvalue(false)}
            />

            {showSearchValue ? (
              <div
                className={cn(
                  "absolute top-[100%] overflow-y-auto left-0 max-h-[200px] w-full shadow-sm shadow-gray-600 z-[9]",
                  scrollbar_style.scrollbar
                )}
              >
                <ul>
                  {choices
                    .filter((value) => value.includes(searchInput.trim()))
                    .map((value, idx) => (
                      <li
                        key={idx}
                        className="p-2 bg-slate-100 hover:cursor-pointer hover:bg-slate-300 flex flex-row items-center"
                        onClick={(e) => {
                          if (!onValuesChanged) return;
                          if (chosenValues.includes(value))
                            onValuesChanged(
                              chosenValues.filter((v) => v !== value)
                            );
                          else onValuesChanged([...chosenValues, value]);
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <p className="flex-1">{value}</p>
                        {chosenValues.includes(value) ? (
                          <Check size={16} />
                        ) : null}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
          {chosenValues.map((val, idx) => (
            <div
              key={idx}
              className="flex flex-row items-center space-x-3 mb-3"
            >
              <p className="text-[0.8rem] flex-1 hover:cursor-pointer font-normal">
                {val}
              </p>
              <XCircle
                size={16}
                color="#FFFFFF"
                fill="rgb(96 165 250)"
                className="w-4 h-4 hover:cursor-pointer p-0"
                onClick={(e) => {
                  if (onValuesChanged)
                    onValuesChanged(chosenValues.filter((v) => v !== val));
                }}
              />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const RangeFilter = ({
  title,
  firstLabel = "From",
  firstPlaceholder = "Value",
  secondLabel = "To",
  secondPlaceholder = "Value",
  alwaysOpen,
  range = { startValue: 0, endValue: 0 },
  className,
  onValuesChanged,
}: {
  title: string;
  firstPlaceholder?: string;
  firstLabel?: string;
  secondPlaceholder?: string;
  secondLabel?: string;
  alwaysOpen?: boolean;
  range: { startValue: number; endValue: number };
  className?: string;
  onValuesChanged?: (range: { startValue: number; endValue: number }) => void;
}) => {
  return (
    <Accordion
      type="single"
      collapsible={!alwaysOpen}
      defaultValue="item-1"
      className={cn("w-full bg-white rounded-md px-4", className)}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger showArrowFunc={alwaysOpen ? "hidden" : ""}>
          <div className="flex flex-row items-center w-full">
            <p className="text-[0.8rem] leading-4 font-bold text-start flex-1">
              {title}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className="overflow-hidden">
          <div className="flex flex-col mb-4 relative space-y-2">
            <div className="flex flex-row justify-between items-center space-x-2">
              <Label className="w-[50px]">{firstLabel}</Label>
              <Input
                className="w-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
                placeholder={firstPlaceholder}
                onChange={(e) => {
                  removeCharNotANum(e);
                  if (onValuesChanged)
                    onValuesChanged({
                      startValue: Number.parseInt(e.target.value),
                      endValue: range.endValue,
                    });
                }}
              />
            </div>
            <div className="flex flex-row justify-between items-center space-x-2">
              <Label className="w-[50px]">{secondLabel}</Label>
              <Input
                className="w-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0"
                placeholder={secondPlaceholder}
                onChange={(e) => {
                  removeCharNotANum(e);
                  if (onValuesChanged)
                    onValuesChanged({
                      startValue: range.startValue,
                      endValue: Number.parseInt(e.target.value),
                    });
                }}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const PageWithFilters = ({
  title,
  filters,
  headerButtons,
  children,
}: {
  title: string;
  filters: React.JSX.Element[];
  headerButtons?: React.JSX.Element[];
  children: React.ReactNode;
}) => {
  const [openFilter, setOpenFilter] = useState(false);

  useEffect(() => {
    const screenObserver = (e: MediaQueryListEvent) => {
      if (e.matches) setOpenFilter(false);
    };

    const mql = window.matchMedia("(min-width: 768px)");
    mql.addEventListener("change", screenObserver);

    return () => {
      mql.removeEventListener("change", screenObserver);
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          "flex flex-col flex-1 px-4 py-2 rounded-sm min-w-0 bg-white lg:mr-[260px] md:mr-[200px]"
        )}
      >
        <div className="flex flex-row items-center">
          <h2 className="flex-1 text-start font-semibold text-2xl my-4">
            {title}
          </h2>
          <div className="flex-1 min-w-[8px]" />
          {headerButtons}
          <Filter
            size={20}
            className="ml-2 md:hidden hover:cursor-pointer"
            onClick={(e) => setOpenFilter((prev) => !prev)}
          />
        </div>
        {openFilter ? null : children}
      </div>
      <div
        className={cn(
          "h-full fixed top-2 overflow-hidden",
          openFilter
            ? "w-full p-3 top-0 left-0 z-[50] bg-slate-400"
            : "lg:w-[260px] md:right-2 md:w-[200px] max-md:hidden"
        )}
      >
        <div className="flex flex-col">
          <ScrollArea className={cn("rounded-md", openFilter ? "pr-[1px]" : "")}>
            <div className={openFilter ? "h-[calc(96vh-40px)]" : "h-[96vh]"}>
              {...filters}
            </div>
          </ScrollArea>
          {openFilter ? (
            <Button
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                setOpenFilter(false);
              }}
            >
              Close Filters
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
};

export {
  ChoicesFilter,
  TimeFilter,
  SecondaryTimeFilter,
  SearchFilter,
  RangeFilter,
  PageWithFilters,
  FilterDay,
  FilterMonth,
  FilterWeek,
  FilterQuarter,
  FilterYear,
};
