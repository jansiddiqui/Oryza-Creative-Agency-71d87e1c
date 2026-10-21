-- Phase 5A: "Approved by the client via WhatsApp/call". A team member may record a client's approval given outside the
-- approval link, after confirming with a required short note. It is written to the activity log (who, when, note,
-- channel) and shown on the post as "Approved offline by <name>". Owners can switch the option off.

alter table public.ops_settings add column allow_offline_approval boolean not null default true;

alter table public.audit_log drop constraint audit_log_action_check;
alter table public.audit_log add constraint audit_log_action_check check (action in (
  'image.upload', 'image.approve', 'image.replace', 'image.rollback', 'image.remove', 'image.delete',
  'image.focal', 'lead.update', 'user.add', 'user.update',
  'client.create', 'client.update', 'plan.generate', 'plan.edit', 'plan.approve',
  'item.move', 'item.update', 'task.update', 'shoot.update', 'onboarding.update',
  'team.update', 'rules.update', 'settings.update',
  'task.reassign', 'leave.update', 'estimates.update', 'shoot.move', 'shot.update', 'asset.add', 'asset.remove',
  'approval.create', 'approval.revoke', 'approval.send', 'client.approved', 'client.changes_requested',
  'reminder.sent', 'report.update', 'report.share', 'billing.update', 'invoice.update',
  'client.approved_offline'));
