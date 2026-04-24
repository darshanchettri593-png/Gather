export function downloadICS(event: {
  id: string;
  title: string;
  event_datetime: string;
  description?: string;
  location_text?: string;
}) {
  const dtStart =
    new Date(event.event_datetime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtEnd =
    new Date(new Date(event.event_datetime).getTime() + 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";

  const icsStr = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gather//EN
BEGIN:VEVENT
UID:${event.id}@gather
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
LOCATION:${event.location_text || ""}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsStr], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function requestNotificationPermission(eventTitle: string) {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Reminder set!", {
          body: `We'll remind you before "${eventTitle}" begins.`,
        });
      }
    });
  }
}
