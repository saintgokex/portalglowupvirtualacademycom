import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "submission" | "feedback";
  submissionId: string;
  assignmentTitle: string;
  studentName?: string;
  teacherName?: string;
  feedback?: string;
  status?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, submissionId, assignmentTitle, studentName, teacherName, feedback, status }: NotificationRequest = await req.json();

    // Get submission details
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("student_id, teacher_id, assignment_id")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      throw new Error("Submission not found");
    }

    // Get user emails for notification
    let recipientUserId: string;
    let recipientEmail: string | null = null;
    let notificationTitle: string;
    let notificationMessage: string;
    let emailSubject: string;
    let emailHtml: string;

    if (type === "submission") {
      // Notify teacher about new submission
      recipientUserId = submission.teacher_id;
      notificationTitle = "New Assignment Submission";
      notificationMessage = `${studentName || "A student"} submitted their work for "${assignmentTitle}"`;
      emailSubject = `New Submission: ${assignmentTitle}`;
      emailHtml = `
        <h1>New Assignment Submission</h1>
        <p><strong>${studentName || "A student"}</strong> has submitted their work for <strong>"${assignmentTitle}"</strong>.</p>
        <p>Please log in to review the submission and provide feedback.</p>
        <p>Best regards,<br>GlowUp Virtual Academy</p>
      `;
    } else {
      // Notify student about feedback
      // Get student's user_id from students table
      const { data: student } = await supabase
        .from("students")
        .select("user_id")
        .eq("id", submission.student_id)
        .single();

      if (!student?.user_id) {
        throw new Error("Student user not found");
      }

      recipientUserId = student.user_id;
      const statusText = status === "reviewed" ? "reviewed" : "needs revision";
      notificationTitle = "Assignment Feedback Received";
      notificationMessage = `${teacherName || "Your teacher"} has ${statusText} your submission for "${assignmentTitle}"${feedback ? `: "${feedback}"` : ""}`;
      emailSubject = `Feedback on: ${assignmentTitle}`;
      emailHtml = `
        <h1>Assignment Feedback</h1>
        <p>Your teacher has reviewed your submission for <strong>"${assignmentTitle}"</strong>.</p>
        <p><strong>Status:</strong> ${status === "reviewed" ? "Reviewed ✓" : "Needs Revision"}</p>
        ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ""}
        <p>Please log in to view the details.</p>
        <p>Best regards,<br>GlowUp Virtual Academy</p>
      `;
    }

    // Create in-app notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: recipientUserId,
      type,
      title: notificationTitle,
      message: notificationMessage,
      data: { submissionId, assignmentTitle, status, feedback },
    });

    if (notifError) {
      console.error("Error creating notification:", notifError);
    }

    // Get recipient email from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(recipientUserId);
    recipientEmail = authUser?.user?.email || null;

    // Send email if we have an email address and API key
    if (recipientEmail && resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "GlowUp Academy <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log("Email sent successfully");
        } else {
          const errorData = await emailResponse.text();
          console.error("Email send failed:", errorData);
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);