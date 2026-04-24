import { LegalPageLayout } from "@/components/layout/legal-page-layout";
import { AlertCircle } from "lucide-react";

export function CommunityGuidelinesPage() {
  return (
    <LegalPageLayout title="Community Guidelines" lastUpdated="LAST UPDATED APRIL 2026">
      <p className="text-[15px] font-normal text-neutral-700 leading-[1.6] mb-4">
        Gather exists to bring people together in real life — for runs, jam sessions, art, hikes, and everything in between. To keep this space welcoming and safe, here's what we expect from everyone.
      </p>

      <h2 className="text-[18px] font-semibold text-[#1A1A1A] mt-8 mb-3">The basics</h2>

      <ol>
        <li>
          <span className="font-semibold text-neutral-900 inline">Be a real person. </span>
          Use your real name and a clear photo. No anonymous accounts, no fake personas, no impersonating others.
        </li>
        <li>
          <span className="font-semibold text-neutral-900 inline">Host events you'd actually show up to. </span>
          If you create an event, you commit to being there. No fake events, no bait, no last-minute ghosting without good reason.
        </li>
        <li>
          <span className="font-semibold text-neutral-900 inline">Make events open to everyone. </span>
          Gather is built on the idea that community is for all. Don't exclude people based on caste, religion, gender, sexuality, body type, ability, or background.
        </li>
        <li>
          <span className="font-semibold text-neutral-900 inline">Show up with good energy. </span>
          You're meeting strangers. Be kind, be curious, assume good intent. The vibe of every event depends on the people who show up.
        </li>
      </ol>

      <div className="bg-[#FFF5F2] border border-[#FFE4DD] rounded-xl p-6 my-8">
        <h2 className="flex items-center text-[18px] font-semibold text-[#1A1A1A] mb-3 mt-0">
          <AlertCircle className="w-5 h-5 text-[#C44827] mr-2 shrink-0" />
          What's not allowed
        </h2>
        <ul className="cross-list text-[15px] text-neutral-700 mb-0">
          <li>Events that promote hate, violence, harassment, or discrimination</li>
          <li>Events that require payment, donations, or "entry fees" of any kind (Gather is free, period)</li>
          <li>Events that are actually disguised business pitches, MLM recruitment, or sales seminars</li>
          <li>Events involving illegal activities</li>
          <li>Sexual or explicit content</li>
          <li>Events that put attendees in obvious danger</li>
          <li>Spam, fake events, or duplicate listings</li>
        </ul>
      </div>

      <h2 className="text-[18px] font-semibold text-[#1A1A1A] mt-8 mb-3">Safety first</h2>

      <ul className="text-[15px] text-neutral-700">
        <li>Meet in public spaces, especially for first-time gatherings</li>
        <li>Trust your instincts — if something feels off, leave</li>
        <li>Hosts: be responsive in the comments, share clear meeting points</li>
        <li>If someone makes you uncomfortable at an event, you can report them in-app or contact us directly</li>
      </ul>

      <h2 className="text-[18px] font-semibold text-[#1A1A1A] mt-8 mb-3">Reporting and enforcement</h2>

      <p className="text-[15px] font-normal text-neutral-700 leading-[1.6] mb-4">
        If you see something that breaks these guidelines:
      </p>

      <ul className="text-[15px] text-neutral-700 mb-4">
        <li>Report the event or user using the in-app report button</li>
        <li>Email us at <a href="mailto:hello@gather.app">hello@gather.app</a></li>
      </ul>

      <p className="text-[15px] font-normal text-neutral-700 leading-[1.6] mb-4">
        What happens when someone breaks the rules:
      </p>

      <ul className="text-[15px] text-neutral-700 mb-4">
        <li>First minor offense: a warning</li>
        <li>Repeat or serious offenses: account suspended or removed</li>
        <li>Illegal activity: reported to authorities</li>
      </ul>

      <p className="text-[15px] font-normal text-neutral-700 leading-[1.6] mb-4">
        We're a small team. We can't catch everything. The community keeps Gather safe by speaking up when something's wrong.
      </p>

      <h2 className="text-[18px] font-semibold text-[#1A1A1A] mt-8 mb-3">Hosts have extra responsibility</h2>

      <p className="text-[15px] font-normal text-neutral-700 leading-[1.6] mb-4">
        If you host events, you're shaping the culture of Gather. We expect you to:
      </p>

      <ul className="text-[15px] text-neutral-700 mb-4">
        <li>Show up on time and stay through the event</li>
        <li>Cancel events early if plans change (don't ghost)</li>
        <li>Treat attendees with respect</li>
        <li>Not collect any kind of fee, even unofficially</li>
        <li>Take basic safety into account when picking locations</li>
      </ul>

      <h2 className="text-[18px] font-semibold text-[#1A1A1A] mt-8 mb-3">The spirit of Gather</h2>

      <p className="text-[15px] font-normal text-neutral-700 leading-[1.6] mb-4">
        Rules are the floor, not the ceiling. The real rule is simple: treat everyone the way you'd want to be treated when you show up alone to an event in a new city.
      </p>

      <p className="text-[15px] font-normal text-neutral-700 leading-[1.6] mb-4">
        Gather works when people are generous with their time, open to new connections, and willing to take a small social risk. Thanks for being part of it.
      </p>
    </LegalPageLayout>
  );
}
