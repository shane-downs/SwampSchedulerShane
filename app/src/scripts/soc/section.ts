import {
    API_Days,
    API_Instructor,
    API_Section,
    API_Section_Type,
} from "@scripts/apiTypes";
import { Meetings, MeetTime, noMeetings } from "@scripts/soc";
import { Term } from "@constants/soc";
import { MinMax } from "@scripts/utils.ts";

export class Section {
    uid: string;
    term: Term;
    type: API_Section_Type;
    number: number;
    courseCode: string; // Only for display TODO: consider using getCourse with UID
    displayName: string;
    deptControlled: boolean = false;
    instructors: string[];
    credits: MinMax<number>;
    meetings: Meetings = noMeetings();
    finalExamDate: string;
    startDate: string;
    endDate: string;

    constructor(
        uid: string,
        term: Term,
        sectionJSON: API_Section,
        courseCode: string,
    ) {
        this.uid = uid;
        this.term = term;
        this.type = sectionJSON.sectWeb;
        this.number = sectionJSON.classNumber;
        this.courseCode = courseCode;
        this.displayName = sectionJSON.display;
        this.instructors = [];
        this.credits = new MinMax<number>(
            sectionJSON.credits_min,
            sectionJSON.credits_max,
        );
        // Add every meeting
        for (const api_meetTime of sectionJSON.meetTimes) {
            // Go through meetTimes
            for (const day of api_meetTime.meetDays) // Add a MeetTime for each day with the same schedule
                this.meetings[day].push(
                    new MeetTime(term, api_meetTime, this.isOnline),
                );
        }
        this.instructors = sectionJSON.instructors.map(
            (i: API_Instructor) => i.name,
        );
        this.finalExamDate = sectionJSON.finalExam;

        // Check if is a controlled section, if so change displayName to something "identifiable"
        if (this.displayName == "Departmentally Controlled") {
            this.deptControlled = true;
            this.displayName = courseCode;
        }
        this.startDate = sectionJSON.startDate;
        this.endDate = sectionJSON.endDate;
    }

    // Returns true if any of the meet times conflict
    conflictsWith(other: Section): boolean {
        return API_Days.some((day) =>
            this.meetings[day].some((mT1) =>
                other.meetings[day].some((mT2) => mT1.conflictsWith(mT2)),
            ),
        );
    }

    get isOnline(): boolean {
        return (
            this.type == API_Section_Type.Online ||
            this.type == API_Section_Type.MostlyOnline
        );
    }
}
