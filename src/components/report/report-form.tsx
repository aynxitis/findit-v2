"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { checkPostRateLimit } from "@/lib/utils/rate-limit";
import type { RateLimitResult } from "@/lib/types/api";
import {
  CATEGORIES,
  ZONES,
  WHERE_LEFT,
  CATEGORY_LABELS,
  WHERE_LEFT_LABELS,
  VALID_CATEGORIES,
  VALID_WHERE_LEFT,
  KNOWN_LOCATIONS,
  OTHER_SPOT,
  locationLabel,
  spotOptionsForZone,
} from "@/lib/taxonomy";
import { t } from "@/lib/strings";

const RATE_LIMIT_TIMEOUT_MS = 15000;
const PHOTO_UPLOAD_TIMEOUT_MS = 90000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    ),
  ]);
}

interface ReportFormProps {
  type: "found" | "lost";
}

interface FormData {
  category: string | null;
  zone: string | null;
  spot: string | null;
  customSpot: string;
  whereLeft: string | null;
  date: string;
  description: string;
  photoFile: File | null;
  photoPreview: string | null;
}

interface FormErrors {
  category: boolean;
  location: boolean;
  whereLeft: boolean;
  date: boolean;
  submit: string | null;
}

export function ReportForm({ type }: ReportFormProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const getToday = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<FormData>({
    category: null,
    zone: null,
    spot: null,
    customSpot: "",
    whereLeft: null,
    date: getToday(),
    description: "",
    photoFile: null,
    photoPreview: null,
  });

  const [errors, setErrors] = useState<FormErrors>({
    category: false,
    location: false,
    whereLeft: false,
    date: false,
    submit: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    category: string;
    location: string;
    whereLeft: string;
    date: string;
    description: string;
    hasPhoto: boolean;
  } | null>(null);

  const isTeal = type === "found";
  const accentClass = isTeal ? "selected-found" : "selected-lost";

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (formData.photoPreview) {
        URL.revokeObjectURL(formData.photoPreview);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only cleanup on unmount
  }, []);

  // Chip selection handler
  const selectChip = (
    field: "category" | "zone" | "whereLeft",
    value: string
  ) => {
    setFormData((prev) => {
      const updates: Partial<FormData> = { [field]: value };
      if (field === "zone") {
        updates.spot = null;
        updates.customSpot = "";
      }
      return { ...prev, ...updates };
    });

    if (field === "category") setErrors((prev) => ({ ...prev, category: false }));
    if (field === "zone") setErrors((prev) => ({ ...prev, location: false }));
    if (field === "whereLeft") setErrors((prev) => ({ ...prev, whereLeft: false }));
  };

  const selectSpot = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      spot: value,
      customSpot: value === "other" ? prev.customSpot : "",
    }));
    setErrors((prev) => ({ ...prev, location: false }));
  };

  // Photo handling
  const handlePhotoSelect = useCallback((file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, submit: t("form.error.imageOnly") }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, submit: t("form.error.photoSize") }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => {
      if (prev.photoPreview) URL.revokeObjectURL(prev.photoPreview);
      return { ...prev, photoFile: file, photoPreview: objectUrl };
    });
    setErrors((prev) => ({ ...prev, submit: null }));
  }, []);

  const removePhoto = () => {
    setFormData((prev) => {
      if (prev.photoPreview) URL.revokeObjectURL(prev.photoPreview);
      return { ...prev, photoFile: null, photoPreview: null };
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Get location value
  const getLocationValue = (): string | null => {
    if (formData.zone === "unknown") return "unknown";
    if (!formData.spot) return null;
    if (formData.spot === OTHER_SPOT.slug) return formData.customSpot.trim() || null;
    return formData.spot;
  };

  const getLocationLabel = (): string => {
    if (formData.zone === "unknown") return t("form.locationNotSure");
    if (!formData.spot) return "";
    if (formData.spot === OTHER_SPOT.slug) return formData.customSpot.trim() || "";
    return locationLabel(formData.spot);
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {
      category: !formData.category,
      location: !getLocationValue(),
      whereLeft: type === "found" && !formData.whereLeft,
      date: !formData.date,
      submit: null,
    };

    if (formData.category && !VALID_CATEGORIES.includes(formData.category)) {
      newErrors.category = true;
    }

    const loc = getLocationValue();
    if (loc && !KNOWN_LOCATIONS.includes(loc) && formData.spot !== OTHER_SPOT.slug) {
      newErrors.location = true;
    }
    if (formData.spot === OTHER_SPOT.slug && loc && loc.length > 80) {
      newErrors.location = true;
    }

    if (type === "found" && formData.whereLeft && !VALID_WHERE_LEFT.includes(formData.whereLeft)) {
      newErrors.whereLeft = true;
    }

    if (formData.description.length > 400) {
      newErrors.submit = t("form.error.descriptionLength");
    }

    if (formData.date && formData.date > getToday()) {
      newErrors.date = true;
    }

    setErrors(newErrors);
    return !newErrors.category && !newErrors.location && !newErrors.whereLeft && !newErrors.date && !newErrors.submit;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: null }));

    try {
      // Check rate limit (fail-open: if check fails or times out, allow the post)
      let rateLimit: RateLimitResult;
      try {
        rateLimit = await withTimeout(
          checkPostRateLimit(user.id),
          RATE_LIMIT_TIMEOUT_MS,
          "Rate limit check"
        );
      } catch {
        rateLimit = { allowed: true, hourly_remaining: 3, daily_remaining: 10, reset_in_seconds: null };
      }
      if (!rateLimit.allowed) {
        const resetMinutes = rateLimit.reset_in_seconds
          ? Math.ceil(rateLimit.reset_in_seconds / 60)
          : 1;
        const limitType = rateLimit.daily_remaining === 0 ? "daily" : "hourly";
        const limit = limitType === "daily" ? 10 : 3;
        setErrors((prev) => ({
          ...prev,
          submit: `You've reached the ${limitType} limit of ${limit} posts. Try again in ${resetMinutes}m.`,
        }));
        setIsSubmitting(false);
        return;
      }

      const locationValue = getLocationValue();
      // user_email, user_name, status and created_at are deliberately absent:
      // items_stamp_insert stamps them from the JWT, and migration 013 revokes
      // INSERT on those columns from `authenticated`, so sending them is a 42501.
      const itemData = {
        type,
        category: VALID_CATEGORIES.includes(formData.category!) ? formData.category : null,
        zone: formData.zone?.slice(0, 40) || null,
        location: locationValue?.slice(0, 80) || null,
        where_left: type === "found" && formData.whereLeft && VALID_WHERE_LEFT.includes(formData.whereLeft)
          ? formData.whereLeft
          : null,
        date: formData.date,
        description: formData.description.trim().slice(0, 400) || null,
        photo_url: null as string | null,
        user_id: user.id,
      };

      // Secondary validation
      if (!itemData.category || !itemData.location || (type === "found" && !itemData.where_left)) {
        setErrors((prev) => ({ ...prev, submit: t("form.error.invalidData") }));
        setIsSubmitting(false);
        return;
      }

      // Upload photo to Supabase Storage
      let uploadedPhotoPath: string | null = null;

      if (formData.photoFile) {
        const mimeToExt: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        const ext = mimeToExt[formData.photoFile.type] || formData.photoFile.name.split(".").pop() || "jpg";
        const path = `${type}-items/${user.id}/${Date.now()}.${ext}`;

        const uploadResult = await withTimeout(
          supabase.storage
            .from("item-photos")
            .upload(path, formData.photoFile, {
              cacheControl: "3600",
              upsert: false,
            }),
          PHOTO_UPLOAD_TIMEOUT_MS,
          "Photo upload"
        );

        if (uploadResult.error) {
          throw new Error(t("form.error.photoUpload"));
        }

        const { data: urlData } = supabase.storage
          .from("item-photos")
          .getPublicUrl(path);

        itemData.photo_url = urlData.publicUrl;
        uploadedPhotoPath = path;
      }

      // Insert item
      try {
        const cleanData = Object.fromEntries(
          Object.entries(itemData).filter(([, v]) => v !== null)
        );

        const { error: insertError } = await supabase
          .from("items")
          .insert(cleanData);

        if (insertError) {
          throw new Error(t("form.error.saveItem"));
        }
      } catch (writeErr) {
        // Cleanup uploaded photo on failure
        if (uploadedPhotoPath) {
          void supabase.storage
            .from("item-photos")
            .remove([uploadedPhotoPath])
            .catch(() => {});
        }
        throw writeErr;
      }

      setSubmittedData({
        category: CATEGORY_LABELS[itemData.category] || itemData.category,
        location: getLocationLabel(),
        whereLeft: itemData.where_left ? WHERE_LEFT_LABELS[itemData.where_left] : "",
        date: new Date(itemData.date + "T00:00:00").toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        description: itemData.description || "",
        hasPhoto: !!itemData.photo_url,
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Report submission error:", err);
      const message =
        err instanceof Error && err.message.includes("Photo upload timed out")
          ? t("form.error.photoTimeout")
          : err instanceof Error && err.message.includes("Saving item timed out")
          ? t("form.error.saveTimeout")
          : err instanceof Error && err.message.includes("timed out")
          ? t("form.error.serverTimeout")
          : err instanceof Error
          ? err.message
          : t("form.error.generic");
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Spot options based on zone
  const spotOptions = formData.zone && formData.zone !== "unknown"
    ? spotOptionsForZone(formData.zone)
    : [];

  if (showSuccess && submittedData) {
    return (
      <div className="success-screen">
        <div className={`success-icon ${isTeal ? "success-icon--teal" : "success-icon--red"}`}>
          {"\u2713"}
        </div>
        <h2>{type === "found" ? t("form.success.found.title") : t("form.success.lost.title")}</h2>
        <p>
          {type === "found"
            ? t("form.success.found.body")
            : t("form.success.lost.body")}
        </p>
        <div className="success-card">
          <div className="success-card-row">
            <span>{t("form.success.category")}</span>
            <span>{submittedData.category}</span>
          </div>
          <div className="success-card-row">
            <span>{type === "found" ? t("form.success.foundAt") : t("form.success.lostAt")}</span>
            <span>{submittedData.location}</span>
          </div>
          {type === "found" && submittedData.whereLeft && (
            <div className="success-card-row">
              <span>{t("form.success.itemIs")}</span>
              <span>{submittedData.whereLeft}</span>
            </div>
          )}
          <div className="success-card-row">
            <span>{t("form.success.date")}</span>
            <span>{submittedData.date}</span>
          </div>
          {submittedData.description && (
            <div className="success-card-row">
              <span>{t("form.success.details")}</span>
              <span>{submittedData.description}</span>
            </div>
          )}
          {submittedData.hasPhoto && (
            <div className="success-card-row">
              <span>{t("form.success.photo")}</span>
              <span>{"\u2713"} {t("form.success.attached")}</span>
            </div>
          )}
        </div>
        <div className="success-actions">
          <Link href="/" className="btn-ghost">
            {t("form.success.home")}
          </Link>
          <button
            onClick={() => {
              setShowSuccess(false);
              setSubmittedData(null);
              setFormData({
                category: null,
                zone: null,
                spot: null,
                customSpot: "",
                whereLeft: null,
                date: getToday(),
                description: "",
                photoFile: null,
                photoPreview: null,
              });
              setErrors({ category: false, location: false, whereLeft: false, date: false, submit: null });
            }}
            className={`btn-submit ${isTeal ? "btn-submit--teal" : "btn-submit--red"}`}
          >
            {t("form.success.again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="report-form" onSubmit={handleSubmit} noValidate>
      {/* Category */}
      <div className="form-section" style={{ animationDelay: "0.05s" }}>
        <div className="form-label">
          {type === "found" ? t("form.label.found.category") : t("form.label.lost.category")}
        </div>
        <div className="chip-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              aria-pressed={formData.category === cat.slug}
              className={`chip-form ${formData.category === cat.slug ? accentClass : ""}`}
              onClick={() => selectChip("category", cat.slug)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        {errors.category && (
          <div className="field-error visible" role="alert">{t("form.error.categoryRequired")}</div>
        )}
      </div>

      {/* Location - Zone */}
      <div className="form-section" style={{ animationDelay: "0.1s" }}>
        <div className="form-label">
          {type === "found" ? t("form.label.found.where") : t("form.label.lost.where")}
        </div>
        <div className="chip-grid">
          {ZONES.map((zone) => (
            <button
              key={zone.slug}
              type="button"
              aria-pressed={formData.zone === zone.slug}
              className={`chip-form ${formData.zone === zone.slug ? accentClass : ""}`}
              onClick={() => selectChip("zone", zone.slug)}
            >
              {zone.icon} {zone.label}
            </button>
          ))}
        </div>

        {/* Spot selection */}
        {formData.zone && formData.zone !== "unknown" && (
          <div className="mt-3">
            <div className="form-sublabel">{t("form.label.moreSpecific")}</div>
            <div className="chip-grid">
              {spotOptions.map((spot) => (
                <button
                  key={spot.slug}
                  type="button"
                  aria-pressed={formData.spot === spot.slug}
                  className={`chip-form ${formData.spot === spot.slug ? accentClass : ""}`}
                  onClick={() => selectSpot(spot.slug)}
                >
                  {spot.icon} {spot.shortLabel}
                </button>
              ))}
            </div>
            {formData.spot === "other" && (
              <input
                type="text"
                className={`text-input mt-3 ${isTeal ? "text-input--teal" : "text-input--red"}`}
                placeholder={t("form.spot.placeholder")}
                maxLength={80}
                value={formData.customSpot}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customSpot: e.target.value }))
                }
                style={{ minHeight: "unset", padding: "0.6rem 0.9rem" }}
              />
            )}
          </div>
        )}
        {errors.location && (
          <div className="field-error visible" role="alert">{t("form.error.locationRequired")}</div>
        )}
      </div>

      {/* Where Left (found only) */}
      {type === "found" && (
        <div className="form-section" style={{ animationDelay: "0.15s" }}>
          <div className="form-label">{t("form.label.whereIsItNow")}</div>
          <div className="chip-grid">
            {WHERE_LEFT.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                aria-pressed={formData.whereLeft === opt.slug}
                className={`chip-form ${formData.whereLeft === opt.slug ? accentClass : ""}`}
                onClick={() => selectChip("whereLeft", opt.slug)}
              >
                {opt.icon} {opt.optionLabel}
              </button>
            ))}
          </div>
          {errors.whereLeft && (
            <div className="field-error visible" role="alert">{t("form.error.whereLeftRequired")}</div>
          )}
        </div>
      )}

      {/* Date */}
      <div className="form-section" style={{ animationDelay: "0.2s" }}>
        <div className="form-label">
          {type === "found" ? t("form.label.found.when") : t("form.label.lost.when")}
        </div>
        <input
          type="date"
          className={`date-input ${isTeal ? "date-input--teal" : "date-input--red"}`}
          max={getToday()}
          value={formData.date}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, date: e.target.value }));
            setErrors((prev) => ({ ...prev, date: false }));
          }}
        />
        {errors.date && (
          <div className="field-error visible" role="alert">
            {type === "found" ? t("form.error.dateFound") : t("form.error.dateLost")}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="form-section" style={{ animationDelay: "0.25s" }}>
        <div className="form-label">
          {t("form.label.description")} <span className="optional">{t("form.optional")}</span>
        </div>
        <textarea
          className={`text-input ${isTeal ? "text-input--teal" : "text-input--red"}`}
          placeholder={t("form.description.placeholder")}
          maxLength={400}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      {/* Photo */}
      <div className="form-section" style={{ animationDelay: "0.3s" }}>
        <div className="form-label">
          {t("form.label.photo")} <span className="optional">{t("form.photo.optional")}</span>
        </div>
        <div className="photo-upload">
          {!formData.photoPreview ? (
            <div
              className={`photo-drop ${isTeal ? "photo-drop--teal" : "photo-drop--red"} ${isDragging ? "dragover" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handlePhotoSelect(e.dataTransfer.files[0] || null);
              }}
            >
              <div className="photo-drop-icon">{"\uD83D\uDCF7"}</div>
              <p>
                <strong className={isTeal ? "accent--teal" : "accent--red"}>
                  {t("form.photo.clickToAttach")}
                </strong>{" "}
                {t("form.photo.orDrag")}
              </p>
              <span>{t("form.photo.formats")}</span>
            </div>
          ) : (
            <div className="photo-preview" style={{ display: "block" }}>
              <Image
                src={formData.photoPreview}
                alt={t("form.photo.previewAlt")}
                width={400}
                height={200}
                className="object-cover w-full"
                style={{ height: 200 }}
              />
              <button
                type="button"
                className={`photo-preview-remove ${isTeal ? "photo-preview-remove--teal" : "photo-preview-remove--red"}`}
                onClick={removePhoto}
              >
                {"\u2715"}
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <div className="form-divider" />

      {/* Notice */}
      <div className={`form-notice ${isTeal ? "form-notice--teal" : "form-notice--red"}`}>
        <span className="form-notice-icon">{"\u2726"}</span>
        <p>
          {t("form.notice.a")}{" "}<strong>{t("form.notice.visible")}</strong>{" "}{t("form.notice.b")}{" "}
          <strong>{user?.email}</strong>{" "}
          <strong>{t("form.notice.emailShared")}</strong>{" "}{t("form.notice.with")}{" "}
          {type === "found" ? t("form.notice.owner") : t("form.notice.finder")} {t("form.notice.c")}
        </p>
      </div>

      {/* Submit */}
      <div className="form-submit-row">
        <span className="form-submit-hint">
          {type === "found" ? t("form.hint.found") : t("form.hint.lost")}
        </span>
        <button
          type="submit"
          className={`btn-submit ${isTeal ? "btn-submit--teal" : "btn-submit--red"}`}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("form.submit.posting")
            : type === "found"
            ? t("form.submit.found")
            : t("form.submit.lost")}
        </button>
      </div>

      {errors.submit && (
        <div className="field-error visible mt-2" role="alert">{errors.submit}</div>
      )}
    </form>
  );
}
