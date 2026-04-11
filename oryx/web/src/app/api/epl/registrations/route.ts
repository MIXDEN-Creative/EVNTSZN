import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { JERSEY_NAME_DISCLAIMER } from "@/lib/epl/constants";
import { absoluteUrl, getSeasonContext } from "@/lib/epl/helpers";
import { stripe } from "@/lib/epl/stripe";

const WAIVER_URL = "https://tally.so/r/XxY8xz";

const registrationSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  age: z.coerce.number().int().min(16).max(70),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  positionPrimary: z.string().min(1).max(80),
  positionSecondary: z.string().max(80).optional().default(""),
  experienceLevel: z.string().min(1).max(120),
  jerseyNameRequested: z.string().min(1).max(24),
  preferredJerseyNumber1: z.coerce.number().int().min(0).max(99),
  preferredJerseyNumber2: z.coerce.number().int().min(0).max(99),
  jerseyNamePolicyAccepted: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const formData = await req.formData();

    const parsed = registrationSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      age: formData.get("age"),
      city: formData.get("city"),
      state: formData.get("state"),
      positionPrimary: formData.get("positionPrimary"),
      positionSecondary: formData.get("positionSecondary") || "",
      experienceLevel: formData.get("experienceLevel"),
      jerseyNameRequested: formData.get("jerseyNameRequested"),
      preferredJerseyNumber1: formData.get("preferredJerseyNumber1"),
      preferredJerseyNumber2: formData.get("preferredJerseyNumber2"),
      jerseyNamePolicyAccepted: formData.get("jerseyNamePolicyAccepted") === "true",
    });

    if (parsed.preferredJerseyNumber1 === parsed.preferredJerseyNumber2) {
      return NextResponse.json(
        { error: "Preferred jersey numbers must be different." },
        { status: 400 }
      );
    }

    const requestHost = new URL(req.url).host;
    const season = await getSeasonContext();
    const email = parsed.email.trim().toLowerCase();

    const photoFile = formData.get("headshot") as File | null;
    let headshotStoragePath: string | null = null;

    if (photoFile && photoFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(photoFile.type)) {
        return NextResponse.json(
          { error: "Headshot must be JPG, PNG, or WEBP." },
          { status: 400 }
        );
      }

      const ext =
        photoFile.type === "image/png"
          ? "png"
          : photoFile.type === "image/webp"
          ? "webp"
          : "jpg";

      const safeName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      headshotStoragePath = `${season.seasonId}/${email}/${safeName}`;

      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error: uploadError } = await supabase.storage
        .from("epl-player-photos")
        .upload(headshotStoragePath, buffer, {
          contentType: photoFile.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Photo upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }

    const { data: existingApplication, error: existingApplicationError } = await supabase
      .schema("epl")
      .from("player_applications")
      .select("id")
      .eq("season_id", season.seasonId)
      .ilike("email", email)
      .maybeSingle();

    if (existingApplicationError) {
      console.error("[epl-registration] player_applications lookup failed", {
        email,
        seasonId: season.seasonId,
        error: existingApplicationError,
      });
      throw existingApplicationError;
    }

    if (existingApplication === null) {
      console.log("[epl-registration] no existing application", { email, seasonId: season.seasonId });
    }

    if (existingApplication) {
      return NextResponse.json(
        { error: "This email already has a Season 1 registration in progress." },
        { status: 409 }
      );
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
      .schema("epl")
      .from("player_profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfileError) {
      console.error("[epl-registration] player_profiles lookup failed", {
        email,
        error: existingProfileError,
      });
      throw existingProfileError;
    }

    if (existingProfile === null) {
      console.log("[epl-registration] no existing profile", { email });
    }

    let playerProfileId = existingProfile?.id as string | undefined;

    if (playerProfileId) {
      const { data: updatedProfile, error: profileUpdateError } = await supabase
        .schema("epl")
        .from("player_profiles")
        .update({
          first_name: parsed.firstName.trim(),
          last_name: parsed.lastName.trim(),
          email,
          phone: parsed.phone.trim(),
          age: parsed.age,
          hometown: `${parsed.city.trim()}, ${parsed.state.trim()}`,
          preferred_position: parsed.positionPrimary.trim(),
          secondary_position: parsed.positionSecondary.trim() || null,
          jersey_name: parsed.jerseyNameRequested.trim(),
          preferred_jersey_number_1: parsed.preferredJerseyNumber1,
          preferred_jersey_number_2: parsed.preferredJerseyNumber2,
          jersey_name_policy_accepted: parsed.jerseyNamePolicyAccepted,
          headshot_storage_path: headshotStoragePath,
        })
        .eq("id", playerProfileId)
        .select("id")
        .single();

      if (profileUpdateError || !updatedProfile) {
        console.error("[epl-registration] player_profiles update failed", {
          email,
          playerProfileId,
          error: profileUpdateError,
        });
        throw profileUpdateError || new Error("Could not update player profile");
      }

      playerProfileId = updatedProfile.id as string;
      console.log("[epl-registration] player profile updated", {
        email,
        playerProfileId,
      });
    } else {
      const { data: newProfile, error: profileInsertError } = await supabase
        .schema("epl")
        .from("player_profiles")
        .insert({
          first_name: parsed.firstName.trim(),
          last_name: parsed.lastName.trim(),
          email,
          phone: parsed.phone.trim(),
          age: parsed.age,
          hometown: `${parsed.city.trim()}, ${parsed.state.trim()}`,
          preferred_position: parsed.positionPrimary.trim(),
          secondary_position: parsed.positionSecondary.trim() || null,
          jersey_name: parsed.jerseyNameRequested.trim(),
          preferred_jersey_number_1: parsed.preferredJerseyNumber1,
          preferred_jersey_number_2: parsed.preferredJerseyNumber2,
          jersey_name_policy_accepted: parsed.jerseyNamePolicyAccepted,
          headshot_storage_path: headshotStoragePath,
          status: "prospect",
        })
        .select("id")
        .single();

      if (profileInsertError || !newProfile) {
        console.error("[epl-registration] player_profiles insert failed", {
          email,
          error: profileInsertError,
        });
        throw profileInsertError || new Error("Could not create player profile");
      }

      playerProfileId = newProfile.id as string;
      console.log("[epl-registration] player profile created", {
        email,
        playerProfileId,
      });
    }

    const { data: application, error: applicationError } = await supabase
      .schema("epl")
      .from("player_applications")
      .insert({
        league_id: season.leagueId,
        season_id: season.seasonId,
        player_profile_id: playerProfileId,
        first_name: parsed.firstName.trim(),
        last_name: parsed.lastName.trim(),
        email,
        phone: parsed.phone.trim(),
        age: parsed.age,
        city: parsed.city.trim(),
        state: parsed.state.trim(),
        position_primary: parsed.positionPrimary.trim(),
        position_secondary: parsed.positionSecondary.trim() || null,
        experience_level: parsed.experienceLevel.trim(),
        jersey_name_requested: parsed.jerseyNameRequested.trim(),
        preferred_jersey_number_1: parsed.preferredJerseyNumber1,
        preferred_jersey_number_2: parsed.preferredJerseyNumber2,
        jersey_name_policy_accepted: parsed.jerseyNamePolicyAccepted,
        headshot_storage_path: headshotStoragePath,
        status: "submitted",
        source: "website",
        answers: {
          jerseyNameDisclaimer: JERSEY_NAME_DISCLAIMER,
          waiverUrl: WAIVER_URL,
          waiverStatus: "pending",
        },
      })
      .select("id")
      .single();

    if (applicationError || !application) {
      console.error("[epl-registration] player_applications insert failed", {
        email,
        playerProfileId,
        error: applicationError,
      });
      throw applicationError || new Error("Could not create application");
    }

    console.log("[epl-registration] player application created", {
      email,
      applicationId: application.id,
      playerProfileId,
    });

    const { data: registration, error: registrationError } = await supabase
      .schema("epl")
      .from("season_registrations")
      .insert({
        league_id: season.leagueId,
        season_id: season.seasonId,
        player_profile_id: playerProfileId,
        application_id: application.id,
        registration_status: season.feeCents > 0 ? "pending_payment" : "approved",
        player_status: "prospect",
        payment_amount_cents: season.feeCents,
        waived_fee: season.feeCents === 0,
        registration_source: "website",
        currency_code: "usd",
      })
      .select("id, registration_code")
      .single();

    if (registrationError || !registration) {
      console.error("[epl-registration] season_registrations insert failed", {
        email,
        playerProfileId,
        applicationId: application.id,
        error: registrationError,
      });
      throw registrationError || new Error("Could not create registration");
    }

    console.log("[epl-registration] season registration created", {
      email,
      registrationId: registration.id,
      registrationCode: registration.registration_code,
      applicationId: application.id,
      playerProfileId,
    });

    if (season.feeCents <= 0) {
      return NextResponse.json({
        ok: true,
        checkoutUrl: absoluteUrl(
          `/epl/season-1/register/success?registration=${registration.registration_code}`,
          requestHost,
        ),
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: absoluteUrl(
        `/epl/season-1/register/success?registration=${registration.registration_code}&session_id={CHECKOUT_SESSION_ID}`,
        requestHost,
      ),
      cancel_url: absoluteUrl(`/epl/season-1/register`, requestHost),
      customer_email: email,
      metadata: {
        epl_registration_id: registration.id,
        epl_application_id: application.id,
        epl_player_profile_id: playerProfileId,
        epl_season_id: season.seasonId,
        epl_league: "EPL",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: season.feeCents,
            product_data: {
              name: `${season.leagueName} ${season.seasonName} Player Registration`,
              description: "Season 1 player registration",
            },
          },
        },
      ],
    });

    const { data: updatedRegistration, error: registrationStripeUpdateError } = await supabase
      .schema("epl")
      .from("season_registrations")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", registration.id)
      .select("id, stripe_checkout_session_id")
      .single();

    if (registrationStripeUpdateError || !updatedRegistration) {
      console.error("[epl-registration] season_registrations stripe update failed", {
        email,
        registrationId: registration.id,
        stripeSessionId: session.id,
        error: registrationStripeUpdateError,
      });
      throw registrationStripeUpdateError || new Error("Could not update registration checkout session");
    }

    console.log("[epl-registration] season registration checkout linked", {
      email,
      registrationId: updatedRegistration.id,
      stripeSessionId: updatedRegistration.stripe_checkout_session_id,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Registration could not be completed." },
      { status: 500 }
    );
  }
}
