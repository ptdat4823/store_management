"use client";

import { Button } from "@/components/ui/button";
import { FilterDay, FilterMonth, FilterWeek } from "@/components/ui/filter";
import LoadingCircle from "@/components/ui/loading_circle";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { DailyShift, Shift } from "@/entities/Attendance";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { disablePreloader, showPreloader } from "@/reducers/preloaderReducer";
import {
  addDailyShifts,
  addShift,
  deleteDailyShifts,
  deleteShift,
  setShifts,
  updateDailyShifts,
  updateShift,
} from "@/reducers/shiftReducer";
import { axiosUIErrorHandler } from "@/services/axios_utils";
import ShiftService from "@/services/shift_service";
import { getStaticRangeFilterTime } from "@/utils";
import {
  convertDailyShiftReceived,
  convertDailyShiftToSent,
  convertShiftReceived,
  convertShiftToSent,
} from "@/utils/shiftApiUtils";
import { FileDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { DisplayType, Table } from "./attendance_table";
import { ButtonGroup } from "./button_group";
import { MyDateRangePicker } from "./my_date_range_picker";
import { SetTimeDialog } from "./set_time_dialog";
import { convertStaffReceived } from "@/utils/staffApiUtils";
import StaffService from "@/services/staff_service";
import { setStaffs } from "@/reducers/staffReducer";

export default function Attendance() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const fetchShiftList = async () => {
    dispatch(showPreloader());
    try {
      const res = await ShiftService.getShiftsThisMonth();
      const shiftReceived = res.data.map((shift) =>
        convertShiftReceived(shift),
      );
      dispatch(setShifts(shiftReceived));
    } catch (e) {
      axiosUIErrorHandler(e, toast);
    } finally {
      dispatch(disablePreloader());
    }
  };

  const fetchStaffList = async () => {
    dispatch(showPreloader());
    try {
      const res = await StaffService.getAllStaffs();
      const staffReceived = res.data.map((staff) =>
        convertStaffReceived(staff),
      );
      dispatch(setStaffs(staffReceived));
    } catch (e) {
      axiosUIErrorHandler(e, toast);
    } finally {
      dispatch(disablePreloader());
    }
  };

  useEffect(() => {
    fetchShiftList();
    fetchStaffList();
  }, []);

  const [range, setRange] = useState<{ startDate: Date; endDate: Date }>(
    getStaticRangeFilterTime(FilterWeek.ThisWeek),
  );
  const [displayType, setDisplayType] = useState<DisplayType>("Week");
  const [openSetTimeDialog, setOpenSetTimeDialog] = useState(false);

  const table = useAppSelector((state) => state.shift.value);
  const staffList = useAppSelector((state) => state.staffs.value);
  const [isLoading, setIsLoading] = useState(false);

  const getShiftsByRange = async (range: {
    startDate: Date;
    endDate: Date;
  }) => {
    setIsLoading(true);
    try {
      const resShiftList = await ShiftService.getShiftsByRange(range);
      let shiftList: Shift[] = [];
      resShiftList.data.forEach((shift) => {
        shiftList.push(convertShiftReceived(shift));
      });
      dispatch(setShifts(shiftList));
    } catch (e) {
      axiosUIErrorHandler(e, toast);
      return Promise.reject();
    } finally {
      setIsLoading(false);
    }
  };
  const getShiftsThisMonth = async () => {
    try {
      const resShiftList = await ShiftService.getShiftsThisMonth();
      let shiftList: Shift[] = [];
      resShiftList.data.forEach((shift) => {
        shiftList.push(convertShiftReceived(shift));
      });
      dispatch(setShifts(shiftList));
    } catch (e) {
      axiosUIErrorHandler(e, toast);
      return Promise.reject();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRangeTimeFilterChange = (range: {
    startDate: Date;
    endDate: Date;
  }) => {
    setRange(range);
    setDisplayType("Custom");
    getShiftsByRange(range);
  };
  const handleStaticRangeFilterChange = (value: string) => {
    if (value === "Day") setRange(getStaticRangeFilterTime(FilterDay.Today));
    else if (value === "Week")
      setRange(getStaticRangeFilterTime(FilterWeek.ThisWeek));
    else setRange(getStaticRangeFilterTime(FilterMonth.ThisMonth));
    if (displayType === "Custom") getShiftsThisMonth();
    setDisplayType(value as DisplayType);
  };
  const AddShift = async (shift: Shift) => {
    try {
      const newShift = convertShiftToSent(shift);
      console.log("to sent", newShift);
      const res = await ShiftService.createShift(newShift);
      const result = convertShiftReceived(res.data);
      console.log("received", result);
      dispatch(addShift(result));
      return Promise.resolve();
    } catch (e) {
      axiosUIErrorHandler(e, toast);
      return Promise.reject();
    }
  };
  const UpdateShift = async (id: any, shift: Shift) => {
    try {
      const newShift = convertShiftToSent(shift);
      console.log("to update shift", newShift);
      const res = await ShiftService.updateShift(id, newShift);
      const result = convertShiftReceived(res.data);
      dispatch(updateShift(result));
      return Promise.resolve();
    } catch (e) {
      axiosUIErrorHandler(e, toast);
      return Promise.reject();
    }
  };

  const AddDailyShifts = async (dailyShiftList: DailyShift[]) => {
    try {
      const newDailyShiftList = dailyShiftList.map((dailyShift) =>
        convertDailyShiftToSent(dailyShift),
      );
      console.log("to sent", newDailyShiftList);
      const res = await ShiftService.createDailyShifts(newDailyShiftList);
      console.log("received", res.data);
      const result = res.data.map((dailyShift: any) =>
        convertDailyShiftReceived(dailyShift),
      );
      dispatch(addDailyShifts(result));
      return Promise.resolve();
    } catch (e) {
      axiosUIErrorHandler(e, toast);
      return Promise.reject();
    }
  };
  const UpdateDailyShifts = async (dailyShiftList: DailyShift[]) => {
    try {
      const newDailyShiftList = dailyShiftList.map((dailyShift) =>
        convertDailyShiftToSent(dailyShift),
      );
      const res = await ShiftService.updateDailyShifts(newDailyShiftList);
      if (res.data) {
        const result = res.data.map((dailyShift: any) =>
          convertDailyShiftReceived(dailyShift),
        );
        console.log("res data", res.data);
        dispatch(updateDailyShifts(result));
      } else {
        dispatch(deleteDailyShifts(dailyShiftList));
      }
      return Promise.resolve();
    } catch (e) {
      axiosUIErrorHandler(e, toast);
      return Promise.reject();
    }
  };
  const handleUpdateShift = (value: Shift) => {
    const index = table.findIndex((shift) => shift.id === value.id);
    if (index !== -1) {
      return UpdateShift(value.id, value);
    } else {
      return AddShift(value);
    }
  };
  const handleRemoveShift = async (id: any) => {
    try {
      await ShiftService.deleteShift(id);
      dispatch(deleteShift(id));
      return Promise.resolve();
    } catch (e) {
      axiosUIErrorHandler(e, toast);
      return Promise.reject();
    }
  };

  const handleAddDailyShift = (value: DailyShift[]) => {
    return AddDailyShifts(value);
  };
  const handleUpdateDailyShifts = (value: DailyShift[]) => {
    return UpdateDailyShifts(value);
  };

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <MyDateRangePicker
            rangeTimeValue={range}
            onRangeTimeFilterChanged={handleRangeTimeFilterChange}
          />
          <ButtonGroup
            choices={["Day", "Week", "Month"]}
            defaultValue="Week"
            onValueChange={handleStaticRangeFilterChange}
          />
        </div>
        <div className="flex flex-row items-center gap-4">
          <Button
            variant={"green"}
            className="gap-2"
            onClick={() => setOpenSetTimeDialog(true)}
          >
            <Plus size={16} />
            <span>Set time</span>
          </Button>
          <Button variant={"green"} className="gap-2">
            <FileDown className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="flex h-[500px] w-full items-center justify-center rounded-md bg-gray-200">
          Loading table<LoadingCircle></LoadingCircle>
        </Skeleton>
      ) : (
        <Table
          staffList={staffList}
          rangeDate={range}
          shiftList={table}
          displayType={displayType}
          onUpdateShift={handleUpdateShift}
          onSetTime={handleAddDailyShift}
          onRemoveShift={handleRemoveShift}
          onUpdateDailyShifts={handleUpdateDailyShifts}
        />
      )}

      <SetTimeDialog
        open={openSetTimeDialog}
        setOpen={setOpenSetTimeDialog}
        shiftList={table}
        staffList={staffList}
        specificShift={null}
        submit={handleAddDailyShift}
        onUpdateDailyShifts={handleUpdateDailyShifts}
      />
    </div>
  );
}
