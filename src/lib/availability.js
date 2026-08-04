// Two date ranges overlap if one starts before the other ends, both ways.
// Dates are plain "YYYY-MM-DD" strings, which compare correctly as strings.
export function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export function isRoomBlockedForRange(roomBlocks, roomId, checkIn, checkOut) {
  return roomBlocks
    .filter((block) => block.room_id === roomId)
    .some((block) => rangesOverlap(checkIn, checkOut, block.start_date, block.end_date));
}
