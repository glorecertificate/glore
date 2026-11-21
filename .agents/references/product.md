# Product record

Users, purpose, evidence for copy, principles, and the accessibility standard.

## Users

- Primary: volunteers who earn a GloRe certificate. When a design tradeoff conflicts, the volunteer's path to a certificate wins.
- Volunteers join through a member organization, never as standalone users. Many use a phone.
- Learners take intro and learner courses only. They earn no certificate.
- Organization staff run the program: the owner, representatives, and tutors. Tutors review the certificates assigned to them.
- The GloRe team runs the platform: admins manage users and organizations, and editors write and translate courses.
- Verifiers are HR staff and educational institutions. They read the public certificate page and the PDF, and they never sign in.

## Product Purpose

- GloRe (Global Recognition) certifies the soft skills that people gain through volunteering.
- It turns non-formal learning into a credential that a person can add to a CV.
- It exists because traditional qualifications do not capture this learning, and HR and schools need a signal that they can verify.
- Success: a volunteer completes the courses, gets a certificate approved, and a third party trusts it without contact with GloRe.

## Positioning

- An open network of NGOs issues each certificate under shared quality standards.
- A tutor of the host organization reviews each certificate. An approved certificate is immutable.
- A public page and a QR code on the PDF let anyone verify a certificate.
- Certification is free for volunteers and member organizations at present.

## Operating Context

- The flow for a volunteer: join an organization, take the intro courses, complete 3 to 4 skill courses, and request a certificate.
- A tutor reviews the request and approves it with a level for each skill: Intermediate, Good, or Advanced (D2).
- The activity rule is 3 months or 100 hours with the host organization.
- The skill framework has 25 soft skills in 4 groups: communication, personal, work, and social.
- The PDF follows `.agents/references/certificate-template.pdf`. It holds 1 to 4 tasks and 3 to 4 skills.
- An organization applies at `/register`. A platform admin approves or rejects the application.
- The app is signed-in only, plus the public verification page and the legal pages. It has no marketing landing.
- Associazione Joint, a Milan non-profit founded in 2003, runs the product. Its work covers youth mobility, European volunteering, and non-formal education.
- This repository replaces `international.glorecertificate.net` and `local.glorecertificate.net`, launched in March 2021.

## Capabilities and Constraints

- The specs own the domain rules: `.agents/specs/app.md`, `certificates.md`, and `.agents/references/decisions.md`. A change to one of these facts updates this file in the same change.
- Locales are `en` (default), `es`, and `it`. Every flow must work the same in all three.
- The membership role `admin` reads Owner, Administrador/a, and Amministratore. The platform team role reads Admin in all three locales.
- Invitation copy never names a role as the sender.
- Issued certificates stay valid after the holder deletes the account.
- The Erasmus+ emblem stays on every certificate for now.
- The GloRe team edits UI copy and content translations in the app. The database owns that copy.
- The legal texts of v0.7 are temporary. The GloRe team supplies the final texts.
- Page loads, navigations, and interactions must feel instant on desktop and on a throttled phone.
- The targets are in `config/performance.json`, and `.agents/specs/performance.md` explains how CI measures them.
- Undecided: definitions for Decision making, Initiative, and Work ethic and commitment wait for GloRe review in #40.

## Brand Commitments

- The name is GloRe Certificate. GloRe is short for Global Recognition.
- The skill names and groups match glorecertificate.net. Spanish and Italian names follow its `/es/` and `/it/` skill pages.
- The live sites describe GloRe with these lines, for reference only.
  - "Give value to your volunteering experiences"
  - "An Easy and Professional Way to Certify Your Volunteering Experiences"
- The interface matches the design-system rigor of Linear and GitHub: tokens, type scale, spacing, components, and consistency.
- The interface never borrows their UI patterns, such as profile pages or courses shown as repositories.

## Evidence on Hand

Copy may cite the facts in this file and the facts on the live glorecertificate.net sites. A fetch tool collected the site facts below on 2026-11-15, and it can paraphrase. Check each quote and figure on the live page before UI copy uses it.

### History

- GloRe 1 was an Erasmus+ Capacity Building project from August 2016 to June 2018, led by Joint: https://international.glorecertificate.net/glore-1/
- GloRe 2, "Global Recognition Certificate network" (ref. 2018-3785), had 7 European and 7 Latin American partners: https://international.glorecertificate.net/glore-2/
- The EURECA training course ran in September 2022 in Ligonchio, Italy, with 32 people from 13 countries: https://international.glorecertificate.net/2022/09/24/eureca-training-course/

### Network

- Joining is free at present. A future fee would be at most 200 EUR per organization per year: https://glorecertificate.net
- The network is "open without limitations". A member must respect the Quality Charter and get a recommendation from a current member: https://glorecertificate.net/network/
- The partner page lists 73 organizations in 27 countries, in Europe, Latin America, and Liberia: https://glorecertificate.net/partners/
- The EURECA page says the network has "over 30" organizations. Do not cite a network size without a check of the partner page on that day.

### Testimonials

These quotes are on https://international.glorecertificate.net. The local site shows different wording for some of them.

- Simone Guiducci, volunteer, MSH Peru: "The system is easy and smooth and you have a great support to go through the e-learning modules".
- Jessica Sanchez, president, MSH Peru: "The system allows every organisation to get a customized, unique and no replicable certificate".
- Ana Daniela, HR, Câmara Municipal de Cascais: "Working in HR field you realize how much is needed a tool like this."
- Isabel R. Floríndez, HR, Fluir: "We often wonder about how to give recognition to soft-skills you may acquire during non-formal experiences".
- Two more quotes come from Joint staff, so they are not independent: Tommaso Cosentino Pescetto (president) and Alice Lanfranchi (project manager).

### Absences

- No source gives counts of certificates issued, volunteers certified, or hours. Never invent them.
- No press, award, or independent study is cited.

## Product Principles

1. The volunteer's path from course to approved certificate comes first.
2. Trust is the product. Each surface that a verifier sees must show that the credential is real and current.
3. Speed is part of quality. Each change keeps the UI instant on desktop and on a throttled phone.
4. One network, three languages. A flow is complete only when it works in `en`, `es`, and `it`.
5. Proof is real or absent. Copy cites only the evidence in this file.

## Accessibility & Inclusion

- The required standard is WCAG 2.2 AA.
- `pnpm run qa:atlas` scans every route with axe and the WCAG 2.2 AA tags.
- Many volunteers use a phone, so every flow must work at 390 px wide and on a slow network.
