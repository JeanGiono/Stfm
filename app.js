// 班表管理工具 - 優化版
class ScheduleManager {
    constructor() {
        this.staff = [];
        this.schedule = {};
        this.currentWeek = this.getWeekDates(new Date());
        this.selectedCell = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateDisplay();
        this.hideLoadingScreen();
    }

    // 資料管理
    loadData() {
        try {
            const savedStaff = localStorage.getItem('scheduleStaff');
            const savedSchedule = localStorage.getItem('scheduleData');
            
            if (savedStaff) {
                this.staff = JSON.parse(savedStaff);
            }
            
            if (savedSchedule) {
                this.schedule = JSON.parse(savedSchedule);
            }
        } catch (error) {
            this.showToast('載入資料時發生錯誤', 'error');
        }
    }

    saveData() {
        try {
            localStorage.setItem('scheduleStaff', JSON.stringify(this.staff));
            localStorage.setItem('scheduleData', JSON.stringify(this.schedule));
        } catch (error) {
            this.showToast('儲存資料時發生錯誤', 'error');
        }
    }

    // 事件監聽器設定
    setupEventListeners() {
        // 主題切換
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 工具列按鈕
        document.getElementById('manageStaffBtn').addEventListener('click', () => {
            this.openStaffModal();
        });

        document.getElementById('autoScheduleBtn').addEventListener('click', () => {
            this.autoSchedule();
        });

        document.getElementById('clearScheduleBtn').addEventListener('click', () => {
            this.clearSchedule();
        });

        document.getElementById('printBtn').addEventListener('click', () => {
            this.printSchedule();
        });

        document.getElementById('helpBtn').addEventListener('click', () => {
            this.openHelpModal();
        });

        // 週導航
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.navigateWeek(-1);
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            this.navigateWeek(1);
        });

        // 匯入匯出
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importData();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('backupBtn').addEventListener('click', () => {
            this.createBackup();
        });

        // 搜尋和篩選
        document.getElementById('searchStaff').addEventListener('input', (e) => {
            this.filterSchedule(e.target.value);
        });

        document.getElementById('filterShift').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('filterDepartment').addEventListener('change', () => {
            this.updateDisplay();
        });

        // 模態對話框
        this.setupModalListeners();

        // 人員管理
        this.setupStaffManagementListeners();

        // 隱藏檔案輸入
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });
    }

    setupModalListeners() {
        // 關閉按鈕
        document.querySelectorAll('.modal__close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // 點擊背景關閉
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // 班次選擇
        document.querySelectorAll('.shift-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const shift = e.currentTarget.dataset.shift;
                this.assignShift(this.selectedCell, shift);
                this.closeModal(document.getElementById('shiftModal'));
            });
        });

        // 確認對話框
        document.getElementById('confirmOk').addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
                this.confirmCallback = null;
            }
            this.closeModal(document.getElementById('confirmModal'));
        });

        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.confirmCallback = null;
            this.closeModal(document.getElementById('confirmModal'));
        });
    }

    setupStaffManagementListeners() {
        // 新增人員表單
        document.getElementById('addStaffForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStaff();
        });

        // 人員搜尋
        document.getElementById('staffSearchInput').addEventListener('input', (e) => {
            this.filterStaffList(e.target.value);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'm':
                        e.preventDefault();
                        this.openStaffModal();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.autoSchedule();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.printSchedule();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportData();
                        break;
                }
            } else if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    this.closeModal(activeModal);
                }
            }
        });
    }

    // 主題切換
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.showToast(`已切換至${newTheme === 'dark' ? '深色' : '淺色'}主題`, 'success');
    }

    // 載入畫面
    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 250);
        }, 800);
    }

    // 週次導航
    getWeekDates(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 調整至週一
        const monday = new Date(d.setDate(diff));
        
        const week = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            week.push(day);
        }
        return week;
    }

    navigateWeek(direction) {
        const currentMonday = this.currentWeek[0];
        currentMonday.setDate(currentMonday.getDate() + (direction * 7));
        this.currentWeek = this.getWeekDates(currentMonday);
        this.updateDisplay();
    }

    // 顯示更新
    updateDisplay() {
        this.updateWeekDisplay();
        this.updateScheduleGrid();
        this.updateDepartmentFilter();
        this.updateStatistics();
    }

    updateWeekDisplay() {
        const firstDay = this.currentWeek[0];
        const year = firstDay.getFullYear();
        const month = firstDay.getMonth() + 1;
        const weekNumber = this.getWeekNumber(firstDay);
        
        document.getElementById('currentWeekDisplay').textContent = 
            `${year}年${month}月 第${weekNumber}週`;

        // 更新日期標題
        const dayHeaders = document.querySelectorAll('.schedule-cell--day');
        const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
        
        dayHeaders.forEach((header, index) => {
            const date = this.currentWeek[index];
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            header.innerHTML = `${dayNames[index]}<br><span class="date-small">${dateStr}</span>`;
        });
    }

    updateScheduleGrid() {
        const scheduleBody = document.getElementById('scheduleBody');
        scheduleBody.innerHTML = '';

        const filteredStaff = this.getFilteredStaff();

        filteredStaff.forEach(staff => {
            const row = document.createElement('div');
            row.className = 'schedule-row';

            // 人員資訊欄
            const staffCell = document.createElement('div');
            staffCell.className = 'staff-cell';
            staffCell.innerHTML = `
                <div class="staff-name">${staff.name}</div>
                <div class="staff-department">${staff.department || '未分類'}</div>
            `;
            row.appendChild(staffCell);

            // 班次欄位
            this.currentWeek.forEach((date, dayIndex) => {
                const dateKey = this.getDateKey(date);
                const shiftCell = document.createElement('div');
                shiftCell.className = 'shift-cell';
                
                if (dayIndex >= 5) { // 週末
                    shiftCell.classList.add('weekend');
                }

                const shift = this.getShift(staff.id, dateKey);
                if (shift) {
                    shiftCell.innerHTML = `
                        <div class="shift-badge shift-badge--${this.getShiftClass(shift)}">
                            ${shift}
                        </div>
                    `;
                }

                shiftCell.addEventListener('click', () => {
                    this.selectedCell = { staffId: staff.id, date: dateKey };
                    this.openShiftModal(staff.name, this.formatDate(date));
                });

                row.appendChild(shiftCell);
            });

            scheduleBody.appendChild(row);
        });
    }

    updateDepartmentFilter() {
        const select = document.getElementById('filterDepartment');
        const departments = [...new Set(this.staff.map(s => s.department).filter(d => d))];
        
        select.innerHTML = '<option value="">所有部門</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            select.appendChild(option);
        });
    }

    updateStatistics() {
        const stats = this.calculateStatistics();
        
        document.getElementById('totalHours').textContent = stats.totalHours;
        document.getElementById('scheduledStaff').textContent = stats.scheduledStaff;
        document.getElementById('vacantShifts').textContent = stats.vacantShifts;
        document.getElementById('overtimeHours').textContent = stats.overtimeHours;
    }

    // 人員管理
    openStaffModal() {
        this.updateStaffList();
        this.openModal(document.getElementById('staffModal'));
    }

    addStaff() {
        const name = document.getElementById('staffName').value.trim();
        const department = document.getElementById('staffDepartment').value.trim();
        const position = document.getElementById('staffPosition').value.trim();
        const staffId = document.getElementById('staffId').value.trim();
        
        const shifts = Array.from(document.querySelectorAll('.shift-checkbox:checked'))
                           .map(cb => cb.value);

        if (!name) {
            this.showToast('請輸入員工姓名', 'error');
            return;
        }

        const newStaff = {
            id: Date.now().toString(),
            name,
            department,
            position,
            staffId,
            availableShifts: shifts,
            createdAt: new Date()
        };

        this.staff.push(newStaff);
        this.saveData();
        this.updateStaffList();
        this.updateDisplay();
        this.clearStaffForm();
        this.showToast('人員新增成功', 'success');
    }

    editStaff(staffId) {
        const staff = this.staff.find(s => s.id === staffId);
        if (!staff) return;

        // 填入表單
        document.getElementById('staffName').value = staff.name;
        document.getElementById('staffDepartment').value = staff.department || '';
        document.getElementById('staffPosition').value = staff.position || '';
        document.getElementById('staffId').value = staff.staffId || '';

        // 設定可用班次
        document.querySelectorAll('.shift-checkbox').forEach(cb => {
            cb.checked = staff.availableShifts.includes(cb.value);
        });

        // 暫存編輯ID
        document.getElementById('addStaffForm').dataset.editId = staffId;
        
        const submitBtn = document.querySelector('#addStaffForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> 儲存變更';
    }

    deleteStaff(staffId) {
        this.showConfirm('確定要刪除此人員嗎？此操作無法復原。', () => {
            this.staff = this.staff.filter(s => s.id !== staffId);
            
            // 刪除相關排班資料
            Object.keys(this.schedule).forEach(key => {
                if (key.startsWith(staffId + '_')) {
                    delete this.schedule[key];
                }
            });

            this.saveData();
            this.updateStaffList();
            this.updateDisplay();
            this.showToast('人員已刪除', 'success');
        });
    }

    updateStaffList() {
        const container = document.getElementById('staffListContainer');
        container.innerHTML = '';

        this.staff.forEach(staff => {
            const item = document.createElement('div');
            item.className = 'staff-item';
            item.innerHTML = `
                <div class="staff-item__header">
                    <span class="staff-item__name">${staff.name}</span>
                    <div class="staff-item__actions">
                        <button class="btn btn--sm btn--outline" onclick="scheduleManager.editStaff('${staff.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn--sm btn--outline" onclick="scheduleManager.deleteStaff('${staff.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="staff-item__info">
                    ${staff.department ? `部門：${staff.department}<br>` : ''}
                    ${staff.position ? `職位：${staff.position}<br>` : ''}
                    ${staff.staffId ? `員工編號：${staff.staffId}` : ''}
                </div>
                <div class="staff-item__shifts">
                    ${staff.availableShifts.map(shift => 
                        `<span class="shift-tag">${shift}</span>`
                    ).join('')}
                </div>
            `;
            container.appendChild(item);
        });
    }

    clearStaffForm() {
        document.getElementById('addStaffForm').reset();
        document.getElementById('addStaffForm').removeAttribute('data-edit-id');
        
        const submitBtn = document.querySelector('#addStaffForm button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> 新增人員';
    }

    filterStaffList(query) {
        const items = document.querySelectorAll('.staff-item');
        items.forEach(item => {
            const name = item.querySelector('.staff-item__name').textContent;
            const info = item.querySelector('.staff-item__info').textContent;
            const visible = name.includes(query) || info.includes(query);
            item.style.display = visible ? 'block' : 'none';
        });
    }

    // 班次管理
    openShiftModal(staffName, date) {
        document.getElementById('shiftModalTitle').textContent = `${staffName} - ${date}`;
        this.openModal(document.getElementById('shiftModal'));
    }

    assignShift(cellInfo, shift) {
        if (!cellInfo) return;

        const key = `${cellInfo.staffId}_${cellInfo.date}`;
        
        if (shift) {
            // 檢查是否可以分配此班次
            const staff = this.staff.find(s => s.id === cellInfo.staffId);
            if (staff && !staff.availableShifts.includes(shift)) {
                this.showToast(`該員工無法執行${shift}`, 'warning');
                return;
            }
            this.schedule[key] = shift;
        } else {
            delete this.schedule[key];
        }

        this.saveData();
        this.updateDisplay();
        this.showToast(shift ? '班次分配成功' : '班次已移除', 'success');
    }

    getShift(staffId, date) {
        return this.schedule[`${staffId}_${date}`];
    }

    getShiftClass(shift) {
        switch (shift) {
            case '早班': return 'early';
            case '中班': return 'middle';
            case '晚班': return 'night';
            default: return '';
        }
    }

    // 自動排班
    autoSchedule() {
        this.showConfirm('確定要自動排班嗎？這會覆蓋現有的班表。', () => {
            this.generateAutoSchedule();
        });
    }

    generateAutoSchedule() {
        // 清空當週排班
        this.currentWeek.forEach(date => {
            const dateKey = this.getDateKey(date);
            this.staff.forEach(staff => {
                const key = `${staff.id}_${dateKey}`;
                delete this.schedule[key];
            });
        });

        const shifts = ['早班', '中班', '晚班'];
        
        this.currentWeek.forEach(date => {
            const dateKey = this.getDateKey(date);
            const availableStaff = [...this.staff];
            
            shifts.forEach(shift => {
                const eligibleStaff = availableStaff.filter(staff => 
                    staff.availableShifts.includes(shift)
                );
                
                if (eligibleStaff.length > 0) {
                    const randomIndex = Math.floor(Math.random() * eligibleStaff.length);
                    const selectedStaff = eligibleStaff[randomIndex];
                    
                    this.schedule[`${selectedStaff.id}_${dateKey}`] = shift;
                    
                    // 移除已分配的員工，避免重複分配
                    const staffIndex = availableStaff.indexOf(selectedStaff);
                    availableStaff.splice(staffIndex, 1);
                }
            });
        });

        this.saveData();
        this.updateDisplay();
        this.showToast('自動排班完成', 'success');
    }

    clearSchedule() {
        this.showConfirm('確定要清空當週班表嗎？', () => {
            this.currentWeek.forEach(date => {
                const dateKey = this.getDateKey(date);
                this.staff.forEach(staff => {
                    const key = `${staff.id}_${dateKey}`;
                    delete this.schedule[key];
                });
            });

            this.saveData();
            this.updateDisplay();
            this.showToast('班表已清空', 'success');
        });
    }

    // 搜尋和篩選
    getFilteredStaff() {
        let filtered = [...this.staff];
        
        const searchQuery = document.getElementById('searchStaff').value.toLowerCase();
        const shiftFilter = document.getElementById('filterShift').value;
        const departmentFilter = document.getElementById('filterDepartment').value;

        if (searchQuery) {
            filtered = filtered.filter(staff => 
                staff.name.toLowerCase().includes(searchQuery) ||
                (staff.department && staff.department.toLowerCase().includes(searchQuery))
            );
        }

        if (shiftFilter) {
            filtered = filtered.filter(staff => 
                staff.availableShifts.includes(shiftFilter)
            );
        }

        if (departmentFilter) {
            filtered = filtered.filter(staff => 
                staff.department === departmentFilter
            );
        }

        return filtered;
    }

    filterSchedule(query) {
        this.updateDisplay();
    }

    // 統計計算
    calculateStatistics() {
        let totalHours = 0;
        let scheduledStaff = new Set();
        let vacantShifts = 0;
        let overtimeHours = 0;

        const staffHours = {};

        this.currentWeek.forEach(date => {
            const dateKey = this.getDateKey(date);
            
            this.staff.forEach(staff => {
                const shift = this.getShift(staff.id, dateKey);
                if (shift) {
                    scheduledStaff.add(staff.id);
                    totalHours += 8; // 每班8小時
                    
                    staffHours[staff.id] = (staffHours[staff.id] || 0) + 8;
                    
                    if (staffHours[staff.id] > 40) {
                        overtimeHours += 8;
                    }
                }
            });

            // 計算空缺班次（每天應該有3個班次）
            const dayShifts = this.staff.filter(staff => 
                this.getShift(staff.id, dateKey)
            ).length;
            
            if (dayShifts < 3) {
                vacantShifts += (3 - dayShifts);
            }
        });

        return {
            totalHours,
            scheduledStaff: scheduledStaff.size,
            vacantShifts,
            overtimeHours
        };
    }

    // 匯入匯出
    exportData() {
        try {
            const data = {
                staff: this.staff,
                schedule: this.schedule,
                exportDate: new Date(),
                version: '2.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], 
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `班表資料_${this.formatDate(new Date())}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showToast('資料匯出成功', 'success');
        } catch (error) {
            this.showToast('匯出失敗', 'error');
        }
    }

    importData() {
        document.getElementById('importFile').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.staff && data.schedule) {
                    this.showConfirm('匯入資料會覆蓋現有資料，確定要繼續嗎？', () => {
                        this.staff = data.staff;
                        this.schedule = data.schedule;
                        this.saveData();
                        this.updateDisplay();
                        this.showToast('資料匯入成功', 'success');
                    });
                } else {
                    this.showToast('檔案格式不正確', 'error');
                }
            } catch (error) {
                this.showToast('檔案解析失敗', 'error');
            }
        };
        reader.readAsText(file);
        
        // 清空文件輸入
        event.target.value = '';
    }

    createBackup() {
        const backupData = {
            staff: this.staff,
            schedule: this.schedule,
            backupDate: new Date(),
            type: 'backup'
        };

        localStorage.setItem('scheduleBackup', JSON.stringify(backupData));
        this.showToast('備份已建立', 'success');
    }

    // 列印功能
    printSchedule() {
        window.print();
    }

    // 說明對話框
    openHelpModal() {
        this.openModal(document.getElementById('helpModal'));
    }

    // 模態對話框管理
    openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 確認對話框
    showConfirm(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        this.confirmCallback = callback;
        this.openModal(document.getElementById('confirmModal'));
    }

    // 提示訊息
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast__icon');
        const messageEl = toast.querySelector('.toast__message');

        // 設定圖示
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        icon.className = `toast__icon ${icons[type]}`;
        messageEl.textContent = message;
        toast.className = `toast toast--${type}`;

        // 顯示
        toast.classList.add('show');

        // 自動隱藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 工具函數
    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}

// 初始化應用程式
let scheduleManager;

document.addEventListener('DOMContentLoaded', () => {
    // 載入主題設定
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-color-scheme', savedTheme);
    
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    // 初始化管理器
    scheduleManager = new ScheduleManager();
});

// 監聽系統主題變更
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
});

// 處理觸控事件（移動端優化）
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', (e) => {
        // 為觸控設備添加特殊處理
        if (e.target.classList.contains('shift-cell')) {
            e.target.style.transform = 'scale(0.95)';
        }
    });

    document.addEventListener('touchend', (e) => {
        if (e.target.classList.contains('shift-cell')) {
            e.target.style.transform = '';
        }
    });
}

// 視窗大小改變時的處理
window.addEventListener('resize', () => {
    // 在移動端關閉所有模態對話框
    if (window.innerWidth < 768) {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal && scheduleManager) {
            scheduleManager.closeModal(activeModal);
        }
    }
});

// 錯誤處理
window.addEventListener('error', (e) => {
    console.error('應用程式錯誤:', e.error);
    if (scheduleManager) {
        scheduleManager.showToast('發生未預期的錯誤', 'error');
    }
});

// 離開頁面前的警告
window.addEventListener('beforeunload', (e) => {
    if (scheduleManager && scheduleManager.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '您有未儲存的變更，確定要離開嗎？';
    }
});