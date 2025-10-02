"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import {
  Mail,
  Send,
  UserPlus,
  Trash2,
  Server,
  FileText,
  User,
  Building2,
  AtSign,
  Lock,
  Hash,
  Paperclip,
  X,
  Check,
  Cloud,
} from "lucide-react";

const TextEditor = dynamic(() => import("./components/TextEditor"), {
  ssr: false,
});

export default function Home() {
  const [recipients, setRecipients] = useState([
    { name: "", email: "", company: "" },
  ]);
  const [subject, setSubject] = useState("");
  const [template, setTemplate] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveTimer, setSaveTimer] = useState(null);
  const [googleSheetsEnabled, setGoogleSheetsEnabled] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  // Load all saved data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load SMTP config
      const savedConfig = localStorage.getItem("smtpConfig");
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          if (config.senderName) setSenderName(config.senderName);
          if (config.smtpUser) setSmtpUser(config.smtpUser);
          if (config.smtpPass) setSmtpPass(config.smtpPass);
          if (config.smtpHost) setSmtpHost(config.smtpHost);
          if (config.smtpPort) setSmtpPort(config.smtpPort);
        } catch (e) {
          console.error("Failed to load SMTP config:", e);
        }
      }

      // Load recipients
      const savedRecipients = localStorage.getItem("recipients");
      if (savedRecipients) {
        try {
          const recipients = JSON.parse(savedRecipients);
          if (recipients.length > 0) setRecipients(recipients);
        } catch (e) {
          console.error("Failed to load recipients:", e);
        }
      }

      // Load email template
      const savedSubject = localStorage.getItem("emailSubject");
      const savedTemplate = localStorage.getItem("emailTemplate");
      if (savedSubject) setSubject(savedSubject);
      if (savedTemplate) setTemplate(savedTemplate);

      // Load Google Sheets config
      const savedGoogleSheets = localStorage.getItem("googleSheetsConfig");
      if (savedGoogleSheets) {
        try {
          const config = JSON.parse(savedGoogleSheets);
          if (config.enabled !== undefined) setGoogleSheetsEnabled(config.enabled);
          if (config.spreadsheetId) setSpreadsheetId(config.spreadsheetId);
          if (config.serviceAccountEmail) setServiceAccountEmail(config.serviceAccountEmail);
          if (config.privateKey) setPrivateKey(config.privateKey);
        } catch (e) {
          console.error("Failed to load Google Sheets config:", e);
        }
      }
    }
  }, []);

  // Helper function to save data with debounce
  const saveData = () => {
    if (saveTimer) clearTimeout(saveTimer);

    const timer = setTimeout(() => {
      setLastSaved(new Date());
    }, 1000); // Wait 1 second after user stops typing

    setSaveTimer(timer);
  };

  // Save SMTP config to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && (smtpUser || smtpPass || senderName)) {
      const config = {
        senderName,
        smtpUser,
        smtpPass,
        smtpHost,
        smtpPort,
      };
      localStorage.setItem("smtpConfig", JSON.stringify(config));
      saveData();
    }
  }, [senderName, smtpUser, smtpPass, smtpHost, smtpPort]);

  // Save recipients to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("recipients", JSON.stringify(recipients));
      saveData();
    }
  }, [recipients]);

  // Save email subject and template to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (subject) localStorage.setItem("emailSubject", subject);
      if (template) localStorage.setItem("emailTemplate", template);
      saveData();
    }
  }, [subject, template]);

  // Save Google Sheets config to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const config = {
        enabled: googleSheetsEnabled,
        spreadsheetId,
        serviceAccountEmail,
        privateKey,
      };
      localStorage.setItem("googleSheetsConfig", JSON.stringify(config));
      saveData();
    }
  }, [googleSheetsEnabled, spreadsheetId, serviceAccountEmail, privateKey]);

  const addRecipient = () => {
    setRecipients([...recipients, { name: "", email: "", company: "" }]);
    toast.success("Recipient added");
  };

  const updateRecipient = (index, field, value) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
    toast.success("Recipient removed");
  };

  const deleteAllRecipients = () => {
    if (recipients.length === 0) {
      toast.error("No recipients to delete");
      return;
    }

    const count = recipients.length;
    if (window.confirm(`Are you sure you want to delete all ${count} recipient(s)? This action cannot be undone.`)) {
      setRecipients([{ name: "", email: "", company: "" }]);
      toast.success(`Deleted ${count} recipient(s)`);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 25 * 1024 * 1024; // 25MB limit
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 25MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setAttachments([...attachments, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added`);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    toast.success("Attachment removed");
  };

  const sendEmails = async () => {
    const validRecipients = recipients.filter(
      (r) => r.email && r.name && r.company
    );

    if (validRecipients.length === 0) {
      toast.error("Please add at least one valid recipient");
      return;
    }

    if (!subject || !template) {
      toast.error("Please fill in subject and email template");
      return;
    }

    if (!smtpUser || !smtpPass) {
      toast.error("Please configure SMTP settings");
      return;
    }

    setSending(true);
    const loadingToast = toast.loading(
      `Sending to ${validRecipients.length} recipient(s)...`
    );

    try {
      // Convert attachments to base64
      const attachmentsData = await Promise.all(
        attachments.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          return {
            filename: file.name,
            content: base64,
            contentType: file.type,
          };
        })
      );

      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: validRecipients,
          template: { subject, content: template },
          attachments: attachmentsData,
          smtpConfig: {
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpPort === "465",
            user: smtpUser,
            pass: smtpPass,
            senderName: senderName,
          },
          googleSheetsConfig: googleSheetsEnabled ? {
            enabled: true,
            spreadsheetId,
            serviceAccountEmail,
            privateKey,
          } : null,
        }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        const sentCount = data.results.filter(
          (r) => r.status === "sent"
        ).length;
        const failedCount = data.results.filter(
          (r) => r.status === "failed"
        ).length;

        if (failedCount === 0) {
          toast.success(`Successfully sent ${sentCount} email(s)!`);
        } else {
          toast.error(`Sent: ${sentCount}, Failed: ${failedCount}`);
        }

        // Show individual results
        data.results.forEach((result) => {
          if (result.status === "sent") {
            toast.success(`✓ ${result.email}`, { duration: 3000 });
          } else {
            toast.error(`✗ ${result.email}: ${result.error}`, {
              duration: 5000,
            });
          }
        });
      } else {
        toast.error("Failed: " + data.error);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        "Error: " + (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      {/* Saved Indicator - Always visible */}
      {lastSaved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-md z-50">
          <Cloud className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-xs text-gray-600">
            Saved locally at {lastSaved.toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-medium text-gray-900">
                    Bulk Email Sender
                  </h1>
                  <p className="text-xs text-gray-500">
                    Send personalized emails at scale
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfig(!showConfig)}
                style={{ color: "black" }}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Server className="w-4 h-4" />
                {showConfig ? "Hide" : "Show"} Config
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* SMTP Configuration - Collapsible */}
          {showConfig && (
            <>
              <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5 text-gray-700" />
                  <h2 className="text-sm font-medium text-gray-900">
                    SMTP Configuration
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your Name (e.g., Anurag Roshan)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="App Password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Port (587)"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Google Sheets Configuration */}
              <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <h2 className="text-sm font-medium text-gray-900">
                    Google Sheets Integration (Optional)
                  </h2>
                  <label className="ml-auto flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={googleSheetsEnabled}
                      onChange={(e) => setGoogleSheetsEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600">Enable</span>
                  </label>
                </div>
                {googleSheetsEnabled && (
                  <div className="space-y-3">
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Spreadsheet ID (from URL)"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Service Account Email"
                        value={serviceAccountEmail}
                        onChange={(e) => setServiceAccountEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        placeholder="Private Key (from service account JSON)"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        rows={3}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium mb-1">Setup Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Create a Google Cloud project and enable Sheets API</li>
                        <li>Create a service account and download the JSON key</li>
                        <li>Share your Google Sheet with the service account email</li>
                        <li>Copy the spreadsheet ID from the URL</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Email Template - Compact */}
          <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-900">
                Email Template
              </h2>
              <span className="text-xs text-gray-500 ml-auto">
                Use {"{name}"}, {"{company}"}, {"{email}"}
              </span>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Subject line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <TextEditor value={template} onChange={setTemplate} />

              {/* Attachments */}
              <div>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-fit">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Attach files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recipients - Compact Table Style */}
          <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-900">
                  Recipients ({recipients.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteAllRecipients}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete All
                </button>
                <button
                  onClick={addRecipient}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 items-center group">
                  <div className="relative flex-1">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name"
                      value={recipient.name}
                      onChange={(e) =>
                        updateRecipient(index, "name", e.target.value)
                      }
                      className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="relative flex-1">
                    <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={recipient.email}
                      onChange={(e) =>
                        updateRecipient(index, "email", e.target.value)
                      }
                      className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Company"
                      value={recipient.company}
                      onChange={(e) =>
                        updateRecipient(index, "company", e.target.value)
                      }
                      className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Send Button - Google Style */}
          <div className="flex justify-end">
            <button
              onClick={sendEmails}
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send All Emails
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
