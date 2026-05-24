from datetime import datetime
from sqlalchemy.orm import Session
from ..models import User

def update_streak(user: User, db: Session):
    """
    Updates the user's coding streak and last activity date.
    Should be called whenever a user performs a key action (e.g., analyze or chat).
    """
    now = datetime.utcnow()
    today_date = now.date()

    if user.last_activity_date is None:
        # First activity ever
        user.current_streak = 1
        user.max_streak = max(user.max_streak, 1)
    else:
        # last_activity_date could be timezone-aware, get just the date portion
        last_active = user.last_activity_date.date()
        delta = today_date - last_active

        if delta.days == 1:
            # Active on the next consecutive day: increment streak
            user.current_streak += 1
            user.max_streak = max(user.max_streak, user.current_streak)
        elif delta.days > 1:
            # Streak broken: reset to 1
            user.current_streak = 1
            user.max_streak = max(user.max_streak, 1)
        # If delta.days == 0, they have already performed activity today, so streak is unchanged.

    user.last_activity_date = now
    db.add(user)
