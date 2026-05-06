import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { TripPlan, DaySchedule } from '../types';
import { getNotifIds, saveNotifIds, getNotifPrefs } from '../storage/storage';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function requestNotifPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('zoneshift', {
      name: 'ZoneShift Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelPlanNotifications(planId: string): Promise<void> {
  const ids = await getNotifIds(planId);
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await saveNotifIds(planId, []);
}

// Hours below this threshold in a HH:MM time are treated as early-AM next day
// (e.g., bedtime "01:00" means 1 AM the following calendar day)
const NEXT_DAY_HOUR_THRESHOLD = 6;

function localTimeToDate(dateStr: string, hhmm: string, tz: string): Date {
  const h = parseInt(hhmm.split(':')[0], 10);
  const actualDate = h < NEXT_DAY_HOUR_THRESHOLD
    ? dayjs(dateStr).add(1, 'day').format('YYYY-MM-DD')
    : dateStr;
  return dayjs.tz(`${actualDate}T${hhmm}:00`, tz).toDate();
}

function fmtAmPm(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export async function schedulePlanNotifications(plan: TripPlan): Promise<void> {
  const prefs = await getNotifPrefs();
  if (!prefs.remindersEnabled) return;

  await cancelPlanNotifications(plan.id);

  const ids: string[] = [];
  const now = Date.now();

  async function fire(date: Date, title: string, body: string) {
    if (date.getTime() <= now) return;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
      ids.push(id);
    } catch {}
  }

  async function processSchedule(
    schedule: DaySchedule[],
    homeTz: string,
    destTz: string,
  ) {
    for (const day of schedule) {
      const isTravel = day.phase === 'travel_day';
      const tz = day.phase === 'post_arrival' ? destTz : homeTz;

      if (prefs.wake && day.wakeTime) {
        await fire(
          localTimeToDate(day.date, day.wakeTime, tz),
          'Wake up',
          `${day.dayLabel} — time to start your jet lag recovery day.`,
        );
      }

      if (!isTravel) {
        if (prefs.lightSeek && day.lightSeekStart) {
          await fire(
            localTimeToDate(day.date, day.lightSeekStart, tz),
            'Seek light now',
            `Get bright light exposure until ${fmtAmPm(day.lightSeekEnd)}.`,
          );
        }

        if (prefs.lightAvoid && day.lightAvoidStart) {
          await fire(
            localTimeToDate(day.date, day.lightAvoidStart, tz),
            'Avoid bright light',
            `Limit light exposure until ${fmtAmPm(day.lightAvoidEnd)} to help your clock shift.`,
          );
        }

        if (prefs.melatonin && day.melatoninTime) {
          await fire(
            localTimeToDate(day.date, day.melatoninTime, tz),
            'Take melatonin',
            'Time for your melatonin dose.',
          );
        }

        if (prefs.caffeine && day.caffeineCutoff) {
          await fire(
            localTimeToDate(day.date, day.caffeineCutoff, tz),
            'Last caffeine',
            "Last caffeine today — avoid it after this time.",
          );
        }

        if (prefs.supplements) {
          for (const supp of day.supplements) {
            await fire(
              localTimeToDate(day.date, supp.suggestedTime, tz),
              supp.name,
              `Time for your ${supp.name}.`,
            );
          }
        }
      }

      if (prefs.bedtime && day.bedTime) {
        const bedH = parseInt(day.bedTime.split(':')[0], 10);
        const bedDateStr = bedH < NEXT_DAY_HOUR_THRESHOLD
          ? dayjs(day.date).add(1, 'day').format('YYYY-MM-DD')
          : day.date;
        const remFire = dayjs.tz(`${bedDateStr}T${day.bedTime}:00`, tz)
          .subtract(prefs.bedtimeLeadMin, 'minute')
          .toDate();
        const leadStr = prefs.bedtimeLeadMin === 60 ? '1 hour' : `${prefs.bedtimeLeadMin} minutes`;
        await fire(remFire, 'Bedtime soon', `Bedtime in ${leadStr} — start winding down.`);
      }
    }
  }

  await processSchedule(
    plan.schedule,
    plan.input.homeCity.timezone,
    plan.input.destCity.timezone,
  );

  if (plan.returnPlan) {
    await processSchedule(
      plan.returnPlan.schedule,
      plan.returnPlan.input.homeCity.timezone,
      plan.returnPlan.input.destCity.timezone,
    );
  }

  await saveNotifIds(plan.id, ids);
}
