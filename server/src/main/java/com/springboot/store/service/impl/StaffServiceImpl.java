package com.springboot.store.service.impl;

import com.springboot.store.entity.*;
import com.springboot.store.exception.CustomException;
import com.springboot.store.exception.ResourceNotFoundException;
import com.springboot.store.payload.StaffRequest;
import com.springboot.store.payload.StaffResponse;
import com.springboot.store.repository.*;
import com.springboot.store.service.ActivityLogService;
import com.springboot.store.service.FileService;
import com.springboot.store.service.StaffSalaryService;
import com.springboot.store.service.StaffService;
import com.springboot.store.utils.Role;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;
import java.util.Objects;

// updated store
@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final StaffRoleRepository staffRoleRepository;
    private final ActivityLogService activityLogService;
    private final MediaRepository mediaRepository;
    private final StaffSalaryService staffSalaryService;
    private final FileService fileService;
    private final ModelMapper modelMapper;
    private final ShiftAttendanceRecordRepository shiftAttendanceRecordRepository;
    private final StaffPositionRepository staffPositionRepository;

    @Override
    public StaffResponse createStaff(StaffRequest newStaff, MultipartFile file) {
        // check if staff is valid
        isStaffValid(newStaff);

        Staff creator = getAuthorizedStaff();

        // check if creator is admin
        if (creator.getStaffRole().getName() != Role.ADMIN && creator.getStaffRole().getName() != Role.OWNER) {
            throw new CustomException("Only admin can create staff", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // convert DTO to entity
        Staff staff = mapToEntity(newStaff);
        staff.setPassword(passwordEncoder.encode(newStaff.getPassword()));
        staff.setCreatedAt(new Date());
        staff.setCreator(creator);
        staff.setStore(creator.getStore());
        staff.setStaffPosition(staffPositionRepository.findByName(newStaff.getPosition()).orElseThrow());

        //check if cccd is duplicate and valid
        if (newStaff.getCccd() != null && newStaff.getCccd().length() == 12 && staffRepository.existsByCccd(newStaff.getCccd())) {
            throw new CustomException("CCCD already in use", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        staff.setCccd(newStaff.getCccd());

        //check if phone number is duplicate and valid
        if (newStaff.getPhoneNumber() != null && staffRepository.existsByPhoneNumber(newStaff.getPhoneNumber())) {
            throw new CustomException("Phone number already in use", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        staff.setPhoneNumber(newStaff.getPhoneNumber());

        if (file != null && !file.isEmpty()) {
            String avatarUrl = fileService.uploadFile(file);
            Media avatar = Media.builder()
                    .url(avatarUrl)
                    .build();
            avatar = mediaRepository.save(avatar);
            staff.setAvatar(avatar);
        }

        StaffSalary staffSalary = modelMapper.map(newStaff.getStaffSalary(), StaffSalary.class);
        staff.setStaffSalary(staffSalary);

        // save entity to database
        staff = staffRepository.save(Objects.requireNonNull(staff));

        // save activity log
        activityLogService.save("CREATE", "Create new staff", creator.getName());

        // convert entity to DTO
        return mapToResponse(staff);
    }

    @Override
    public List<StaffResponse> getAllStaffs() {
        int storeId = getAuthorizedStaff().getStore().getId();
        List<Staff> staffs = staffRepository.findByStoreId(storeId);
        Staff thisStaff = getAuthorizedStaff();
        staffs.removeIf(staff -> staff.getCreator() == null || staff.getCreator() != thisStaff);
        return staffs.stream().map(this::mapToResponse).toList();
    }

    @Override
    public StaffResponse getStaffById(int id) {
        Staff staff = staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        return mapToResponse(staff);
    }

    @Override
    public StaffResponse updateStaff(int id, StaffRequest staffRequest, MultipartFile file) {
        int storeId = getAuthorizedStaff().getStore().getId();
        Staff staff = staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        // check if role is valid
        if (staffRequest.getRole() != null && staffRoleRepository.findByNameAndStoreId(staffRequest.getRole(), storeId).isEmpty()) {
            throw new CustomException("Role is invalid", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        // check if birthday is valid
        if (staffRequest.getBirthday() != null && staffRequest.getBirthday().after(new Date())) {
            throw new CustomException("Birthday is invalid", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        Staff creator = getAuthorizedStaff();

        // check if role changed and if creator is admin
        if (staffRequest.getRole() != null && !staffRequest.getRole().equals(staff.getStaffRole().getName())
                && creator.getStaffRole().getName() != Role.ADMIN) {
            throw new CustomException("Only admin can change staff role", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        staff.setName(staffRequest.getName());
        staff.setAddress(staffRequest.getAddress());
        staff.setNote(staffRequest.getNote());
        staff.setSex(staffRequest.getSex());
        staff.setBirthday(staffRequest.getBirthday());
        staff.setStaffPosition(staffPositionRepository.findByName(staffRequest.getPosition()).orElseThrow());
        staff.setSalaryDebt(staffRequest.getSalaryDebt());
        staff.setStaffRole(staffRequest.getRole() != null
                ? staffRoleRepository.findByNameAndStoreId(staffRequest.getRole(), storeId).orElseThrow()
                : null);

        if (staff.getCccd() != null && staff.getCccd().equals(staffRequest.getCccd())) {
            staff.setCccd(staffRequest.getCccd());
        } else if (staffRequest.getCccd() != null && staffRequest.getCccd().length() == 12 && staffRepository.existsByCccd(staffRequest.getCccd())) {
            throw new CustomException("CCCD already in use", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        staff.setCccd(staffRequest.getCccd());

        if (staff.getPhoneNumber() != null && staff.getPhoneNumber().equals(staffRequest.getPhoneNumber())) {
            staff.setPhoneNumber(staffRequest.getPhoneNumber());
        } else if (staffRequest.getPhoneNumber() != null && staffRequest.getPhoneNumber().length() == 10 && staffRepository.existsByPhoneNumber(staffRequest.getPhoneNumber())) {
            throw new CustomException("Phone number already in use", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        staff.setPhoneNumber(staffRequest.getPhoneNumber());

        if (staff.getStaffSalary() != null)
            staffSalaryService.updateStaffSalary(staff.getStaffSalary().getId(), staffRequest.getStaffSalary());
        else {
            StaffSalary staffSalary = modelMapper.map(staffRequest.getStaffSalary(), StaffSalary.class);
            staff.setStaffSalary(staffSalary);
        }

        if (file != null && !file.isEmpty()) {
            String avatarUrl = fileService.uploadFile(file);
            Media avatar = Media.builder()
                    .url(avatarUrl)
                    .build();
            avatar = mediaRepository.save(avatar);
            staff.setAvatar(avatar);
        }
        if (file == null || file.isEmpty()) {
            staff.setAvatar(null);
        }
        staff = staffRepository.save(staff);

        // save activity log
        activityLogService.save("UPDATE", "Update staff with id " + id, creator.getName());

        return mapToResponse(staff);
    }

    @Override
    public void deleteStaff(int id) {
        Staff creator = getAuthorizedStaff();
        Staff staff = staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        List<ShiftAttendanceRecord> shiftAttendanceRecords = shiftAttendanceRecordRepository.findByStaffId(id);
        shiftAttendanceRecordRepository.deleteAll(shiftAttendanceRecords);
        staffRepository.delete(staff);
        // save activity log
        activityLogService.save("DELETE", "Delete staff with id " + id, creator.getName());
    }

    @Override
    public int getStaffSalary(int id) {
        Staff staff = staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        int salaryDebt = 0;
        if (staff.getStaffSalary().getSalaryType().equals("Shift-based pay")) {
            int dayWorking = 0;
            List<ShiftAttendanceRecord> shiftAttendanceRecords = shiftAttendanceRecordRepository.findByStaffIdAndDateInThisMonth(id);
            for (ShiftAttendanceRecord shiftAttendanceRecord : shiftAttendanceRecords) {
                if (shiftAttendanceRecord.isHasAttend()) {
                    dayWorking++;
                }
                for (StaffBonusSalary staffBonusSalary : shiftAttendanceRecord.getBonusSalaryList()) {
                    salaryDebt += staffBonusSalary.getValue() * staffBonusSalary.getMultiply();
                }
                for (StaffPunishSalary staffPunishSalary : shiftAttendanceRecord.getPunishSalaryList()) {
                    salaryDebt -= staffPunishSalary.getValue() * staffPunishSalary.getMultiply();
                }
            }
            salaryDebt += staff.getStaffSalary().getSalary() * dayWorking;
            staff.setSalaryDebt(salaryDebt);
            staffRepository.save(staff);
            return salaryDebt;
        } else if (staff.getStaffSalary().getSalaryType().equals("Internship salary")) {
            List<ShiftAttendanceRecord> shiftAttendanceRecords = shiftAttendanceRecordRepository.findByStaffIdAndDateInThisMonth(id);
            for (ShiftAttendanceRecord shiftAttendanceRecord : shiftAttendanceRecords) {
                for (StaffBonusSalary staffBonusSalary : shiftAttendanceRecord.getBonusSalaryList()) {
                    salaryDebt += staffBonusSalary.getValue() * staffBonusSalary.getMultiply();
                }
                for (StaffPunishSalary staffPunishSalary : shiftAttendanceRecord.getPunishSalaryList()) {
                    salaryDebt -= staffPunishSalary.getValue() * staffPunishSalary.getMultiply();
                }
            }
            salaryDebt += staff.getStaffSalary().getSalary();
            staff.setSalaryDebt(salaryDebt);
            staffRepository.save(staff);
            return salaryDebt;
        } else if (staff.getStaffSalary().getSalaryType().equals("Fixed salary")) {
            List<ShiftAttendanceRecord> shiftAttendanceRecords = shiftAttendanceRecordRepository.findByStaffIdAndDateInThisMonth(id);
            for (ShiftAttendanceRecord shiftAttendanceRecord : shiftAttendanceRecords) {
                for (StaffBonusSalary staffBonusSalary : shiftAttendanceRecord.getBonusSalaryList()) {
                    salaryDebt += staffBonusSalary.getValue() * staffBonusSalary.getMultiply();
                }
                for (StaffPunishSalary staffPunishSalary : shiftAttendanceRecord.getPunishSalaryList()) {
                    salaryDebt -= staffPunishSalary.getValue() * staffPunishSalary.getMultiply();
                }
            }
            salaryDebt += staff.getStaffSalary().getSalary();
            staff.setSalaryDebt(salaryDebt);
            staffRepository.save(staff);
            return salaryDebt;
        }
        return 0;
    }

    @Override
    public Staff findByEmail(String email) {
        return staffRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Staff", "email", email));
    }


    private StaffResponse mapToResponse(Staff staff) {
        return StaffResponse.builder()
                .id(staff.getId())
                .name(staff.getName())
                .email(staff.getEmail())
                .cccd(staff.getCccd())
                .phoneNumber(staff.getPhoneNumber())
                .position(staff.getStaffPosition().getName())
                .salaryDebt(staff.getSalaryDebt())
                .sex(staff.getSex())
                .address(staff.getAddress())
                .note(staff.getNote())
                .birthday(staff.getBirthday())
                .createdAt(staff.getCreatedAt())
                .avatar(staff.getAvatar() != null ? staff.getAvatar().getUrl() : null)
                // if staffRole is not null, get name of staffRole
                .role(staff.getStaffRole() != null ? staff.getStaffRole().getName() : null)
                // if creator is not null, get name of creator
                .creator(staff.getCreator() != null ? staff.getCreator().getId() : null)
                .staffSalary(staff.getStaffSalary() != null ? staff.getStaffSalary() : null)
                .build();
    }

    private Staff mapToEntity(StaffRequest staffRequest) {

        return Staff.builder()
                .name(staffRequest.getName())
                .email(staffRequest.getEmail())
                .password(staffRequest.getPassword())
                .address(staffRequest.getAddress())
                .phoneNumber(staffRequest.getPhoneNumber())
                .note(staffRequest.getNote())
                .sex(staffRequest.getSex())
                .birthday(staffRequest.getBirthday())
                .staffRole(staffRequest.getRole() != null
                        ? staffRoleRepository.findByNameAndStoreId(staffRequest.getRole(), getAuthorizedStaff().getStore().getId()).orElseThrow()
                        : null)
                .salaryDebt(staffRequest.getSalaryDebt())
                .build();
    }

    private void isStaffValid(StaffRequest newStaff) {
        // check if email is already in use
        if (staffRepository.existsByEmail(newStaff.getEmail())) {
            throw new CustomException("Email already in use", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // check if role is valid
        if (newStaff.getRole() != null && staffRoleRepository.findByNameAndStoreId(newStaff.getRole(), getAuthorizedStaff().getStore().getId()).isEmpty()) {
            throw new CustomException("Role is invalid", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // check if password is valid
        if (newStaff.getPassword().length() < 6) {
            throw new CustomException("Password must be at least 6 characters", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // check if birthday is valid
        if (newStaff.getBirthday() != null && newStaff.getBirthday().after(new Date())) {
            throw new CustomException("Birthday is invalid", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        if (newStaff.getCccd().length() != 12) {
            throw new CustomException("CCCD is invalid", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        if (newStaff.getPhoneNumber().length() != 10) {
            throw new CustomException("Phone number is invalid", HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    @Override
    public Staff getAuthorizedStaff() {
        return staffRepository.findByEmail(SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new UsernameNotFoundException("Your user not found"));
    }
}
