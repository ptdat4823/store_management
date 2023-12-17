import { DailyShift, Shift } from "@/entities/Attendance";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const shiftSlice = createSlice({
  name: "shifts",
  initialState: {
    value: [] as Shift[],
  },
  reducers: {
    setShifts: (state, action: PayloadAction<Shift[]>) => {
      state.value = action.payload;
    },
    addShift: (state, action: PayloadAction<Shift>) => {
      state.value.push(action.payload);
    },
    addShifts: (state, action: PayloadAction<Shift[]>) => {
      action.payload.forEach((shift) => state.value.push(shift));
    },
    updateShift: (state, action: PayloadAction<Shift>) => {
      state.value = state.value.map((shift) =>
        shift.id === action.payload.id ? action.payload : shift,
      );
    },
    deleteShift: (state, action: PayloadAction<number>) => {
      state.value = state.value.filter((shift) => shift.id !== action.payload);
    },
    addDailyShift: (state, action: PayloadAction<DailyShift>) => {
      state.value = state.value.map((shift) =>
        shift.id === action.payload.shiftId
          ? {
              ...shift,
              dailyShiftList: [...shift.dailyShiftList, action.payload],
            }
          : shift,
      );
    },
    addDailyShifts: (state, action: PayloadAction<DailyShift[]>) => {
      action.payload.forEach((dailyShift) => {
        state.value = state.value.map((shift) =>
          shift.id === dailyShift.shiftId
            ? {
                ...shift,
                dailyShiftList: [...shift.dailyShiftList, dailyShift],
              }
            : shift,
        );
      });
    },
    updateDailyShift: (state, action: PayloadAction<DailyShift>) => {
      state.value = state.value.map((shift) =>
        shift.id === action.payload.shiftId
          ? {
              ...shift,
              dailyShiftList: shift.dailyShiftList.map((dailyShift) =>
                dailyShift.date.toLocaleDateString() ===
                action.payload.date.toLocaleDateString()
                  ? action.payload
                  : dailyShift,
              ),
            }
          : shift,
      );
    },
    updateDailyShifts: (state, action: PayloadAction<DailyShift[]>) => {
      //get all dailyShifts existed in action.payload but not in state
      //explain: update dailyShifts means override all dailyShifts in state with dailyShifts in action.payload
      const dailyShiftToAdd = action.payload.filter(
        (dailyShift) =>
          !state.value
            .find((shift) => shift.id === dailyShift.shiftId)
            ?.dailyShiftList.find(
              (_dailyShift) =>
                _dailyShift.date.toLocaleDateString() ===
                dailyShift.date.toLocaleDateString(),
            ),
      );

      dailyShiftToAdd.forEach((dailyShift) => {
        state.value = state.value.map((shift) =>
          shift.id === dailyShift.shiftId
            ? {
                ...shift,
                dailyShiftList: [...shift.dailyShiftList, dailyShift],
              }
            : shift,
        );
      });

      action.payload.forEach((dailyShift) => {
        state.value = state.value.map((shift) =>
          shift.id === dailyShift.shiftId
            ? {
                ...shift,
                dailyShiftList: shift.dailyShiftList.map((_dailyShift) =>
                  dailyShift.date.toLocaleDateString() ===
                  _dailyShift.date.toLocaleDateString()
                    ? dailyShift
                    : _dailyShift,
                ),
              }
            : shift,
        );
      });
    },
    deleteDailyShift: (state, action: PayloadAction<DailyShift>) => {
      state.value = state.value.map((shift) =>
        shift.id === action.payload.shiftId
          ? {
              ...shift,
              dailyShiftList: shift.dailyShiftList.filter(
                (dailyShift) =>
                  dailyShift.date.toLocaleDateString() !==
                  action.payload.date.toLocaleDateString(),
              ),
            }
          : shift,
      );
    },
    deleteDailyShifts: (state, action: PayloadAction<DailyShift[]>) => {
      action.payload.forEach((dailyShift) => {
        state.value = state.value.map((shift) =>
          shift.id === dailyShift.shiftId
            ? {
                ...shift,
                dailyShiftList: shift.dailyShiftList.filter(
                  (_dailyShift) =>
                    dailyShift.date.toLocaleDateString() !==
                    _dailyShift.date.toLocaleDateString(),
                ),
              }
            : shift,
        );
      });
    },
  },
});

export const {
  setShifts,
  addShift,
  addShifts,
  updateShift,
  deleteShift,
  addDailyShift,
  addDailyShifts,
  updateDailyShift,
  updateDailyShifts,
  deleteDailyShift,
  deleteDailyShifts,
} = shiftSlice.actions;
export default shiftSlice.reducer;
