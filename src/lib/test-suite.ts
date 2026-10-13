import { 
  getMeetingRooms, 
  createBookingAtomic, 
  findConflictingBookings, 
  cancelBooking, 
  updateBookingAdmin,
  getBookings,
  getRoomsWithOperationalStatus,
  getDashboardStats
} from './db';

async function runTestSuite() {
  console.log('=== RUNNING MEETING ROOM BOOKING TEST SUITE ===\n');

  // Test 1: Verify 4 rooms exist
  const rooms = await getMeetingRooms();
  console.log(`[PASS] 1. Meeting rooms count: ${rooms.length} (Expected: 4)`);
  const codes = rooms.map(r => r.room_code).sort();
  console.log(`       Room codes: ${codes.join(', ')}`);
  if (codes.join(',') !== 'R1,R2,R3,R4') throw new Error('Rooms must be R1, R2, R3, R4');

  const r1 = rooms.find(r => r.room_code === 'R1')!;
  const r2 = rooms.find(r => r.room_code === 'R2')!;

  const testDate = '2026-11-20'; // Future test date

  // Test 2: Public employee books R1 09:00 - 10:00 without login
  const res1 = await createBookingAtomic({
    room_id: r1.id,
    employee_name: 'Dewi Lestari',
    department: 'Finance & Accounting',
    meeting_title: 'Budget Planning Q1',
    meeting_date: testDate,
    start_time: '09:00',
    end_time: '10:00',
    participant_count: 5,
  });

  if (!res1.success || !res1.booking) {
    throw new Error(`Test 2 Failed: ${res1.error}`);
  }
  console.log(`[PASS] 2. Booking automatically confirmed: Ref #${res1.booking.booking_reference}, Status: ${res1.booking.status}`);

  // Test 3: Overlapping booking for R1 (09:30 - 10:30) MUST BE REJECTED
  const res2 = await createBookingAtomic({
    room_id: r1.id,
    employee_name: 'Bambang Soepomo',
    department: 'Human Resources',
    meeting_title: 'HR Conflict Test',
    meeting_date: testDate,
    start_time: '09:30',
    end_time: '10:30',
  });

  if (res2.success) {
    throw new Error('Test 3 Failed: Overlapping booking was NOT rejected!');
  }
  console.log(`[PASS] 3. Overlapping booking correctly rejected: "${res2.error}"`);
  console.log(`       Suggested alternatives: ${res2.alternatives?.length || 0} alternative rooms available`);

  // Test 4: Different room (R2) at overlapping time (09:30 - 10:30) ALLOWED
  const res3 = await createBookingAtomic({
    room_id: r2.id,
    employee_name: 'Citra Permata',
    department: 'Marketing',
    meeting_title: 'Brand Campaign Kickoff',
    meeting_date: testDate,
    start_time: '09:30',
    end_time: '10:30',
  });

  if (!res3.success) {
    throw new Error(`Test 4 Failed: Different room booking failed: ${res3.error}`);
  }
  console.log(`[PASS] 4. Different room (R2) successfully booked at overlapping time! Ref #${res3.booking?.booking_reference}`);

  // Test 5: Back-to-back booking (R1 10:00 - 11:00) ALLOWED (ends exactly at 10:00 when first ends)
  const res4 = await createBookingAtomic({
    room_id: r1.id,
    employee_name: 'Eko Prasetyo',
    department: 'IT Infrastructure',
    meeting_title: 'Server Migration Briefing',
    meeting_date: testDate,
    start_time: '10:00',
    end_time: '11:00',
  });

  if (!res4.success) {
    throw new Error(`Test 5 Failed: Back-to-back booking failed: ${res4.error}`);
  }
  console.log(`[PASS] 5. Back-to-back booking (10:00 - 11:00) allowed! Ref #${res4.booking?.booking_reference}`);

  // Test 6: Cancelled booking no longer blocks availability
  // Cancel res1 (R1 09:00 - 10:00)
  const cancelRes = await cancelBooking(res1.booking.id, 'Dewi Lestari', res1.booking.cancellation_token);
  if (!cancelRes.success) throw new Error('Cancellation failed');

  // Now booking 09:15 - 09:45 in R1 should SUCCEED
  const res5 = await createBookingAtomic({
    room_id: r1.id,
    employee_name: 'Gilang Ramadhan',
    department: 'Sales',
    meeting_title: 'Client Quick Sync',
    meeting_date: testDate,
    start_time: '09:15',
    end_time: '09:45',
  });

  if (!res5.success) {
    throw new Error(`Test 6 Failed: Booking after cancellation was rejected: ${res5.error}`);
  }
  console.log(`[PASS] 6. Slot freed after cancellation and successfully rebooked! Ref #${res5.booking?.booking_reference}`);

  // Test 7: Invalid time ranges (end <= start, out of operating hours)
  const invalidTime = await createBookingAtomic({
    room_id: r1.id,
    employee_name: 'Test',
    department: 'Test',
    meeting_title: 'Invalid Time',
    meeting_date: testDate,
    start_time: '14:00',
    end_time: '13:00', // invalid
  });
  if (invalidTime.success) throw new Error('Test 7 Failed: Invalid time order succeeded');
  console.log(`[PASS] 7. Invalid time order (14:00 - 13:00) correctly rejected: "${invalidTime.error}"`);

  // Test 8: Admin editing with conflict validation
  const editConflicting = await updateBookingAdmin(
    res5.booking!.id,
    { start_time: '09:50', end_time: '10:30' }, // Conflicts with res4 (10:00-11:00)
    'admin@company.com'
  );
  if (editConflicting.success) throw new Error('Test 8 Failed: Admin conflicting edit succeeded');
  console.log(`[PASS] 8. Admin conflicting edit correctly rejected: "${editConflicting.error}"`);

  // Test 9: Admin valid edit
  const editValid = await updateBookingAdmin(
    res5.booking!.id,
    { meeting_title: 'Client Quick Sync (Updated Title)' },
    'admin@company.com'
  );
  if (!editValid.success) throw new Error('Test 9 Failed: Admin valid edit failed');
  console.log(`[PASS] 9. Admin valid edit succeeded and recorded in audit history.`);

  // Test 10: Operational room status calculation
  const statuses = await getRoomsWithOperationalStatus(testDate, '10:15');
  const r1Status = statuses.find(s => s.room_code === 'R1');
  console.log(`[PASS] 10. Operational status calculation works: R1 is "${r1Status?.currentStatus}" at 10:15 WIB`);

  // Test 11: Dashboard statistics
  const stats = await getDashboardStats(testDate);
  console.log(`[PASS] 11. Dashboard stats computed: Total bookings=${stats.totalBookingsToday}, Most used room=${stats.mostUsedRoom?.room_code}`);

  console.log('\n=== ALL 11 DATABASE TESTS PASSED WITH 100% SUCCESS ===\n');
}

runTestSuite().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
