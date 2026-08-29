import React, { useState, useEffect } from "react";
import { DietPlan, PatientProfile } from "../types";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import { Utensils, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Apple, Heart, Droplets, Flame } from "lucide-react";

interface DietPlanModuleProps {
  profile: PatientProfile;
  patientUserId: string;
}

export const DietPlanModule: React.FC<DietPlanModuleProps> = ({ profile, patientUserId }) => {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [goal, setGoal] = useState("Heart & Respiratory Health");

  const fetchDietPlans = async () => {
    setIsLoading(true);
    try {
      const data = await safeFetchJson<DietPlan[]>(`/api/patient/diet-plans/${patientUserId}`, undefined, []);
      if (Array.isArray(data) && data.length > 0) {
        setDietPlans(data);
      } else {
        // Fallback default diet plan
        setDietPlans([
          {
            id: "diet_default",
            patientId: patientUserId,
            patientHealthId: profile.globalHealthId,
            doctorName: "Dr. Elena Vance (Clinical Nutritionist)",
            hospitalName: "Central Health Institute",
            title: "Anti-Inflammatory Cardio & Metabolic Diet",
            category: "Heart & Vascular Care",
            createdDate: "2026-08-08",
            dailyCaloriesTarget: "1850 kcal",
            waterIntakeLiters: 3.2,
            meals: {
              breakfast: "Warm oatmeal with chia seeds, sliced bananas & raw walnuts (08:00 AM)",
              lunch: "Steamed brown rice, yellow lentil soup, sautéed spinach & cucumber mint salad (01:00 PM)",
              eveningSnack: "Green tea or herbal infusion with dry roasted chickpeas (05:00 PM)",
              dinner: "Multigrain flatbread, boiled green vegetables & bottle gourd soup (08:00 PM)"
            },
            restrictedFoods: ["Refined sugars & carbonated sodas", "Deep fried sodium snacks", "Processed meat cuts", "High fat dairy"],
            recommendedFoods: ["Fresh spinach, kale & broccoli", "Pomegranate & blueberries", "Raw almonds & chia seeds", "Flaxseed oil"],
            doctorAdvice: "Maintain regular 4-hour meal windows. Stay hydrated with room-temperature water throughout the day."
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load diet plans:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDietPlans();
  }, [patientUserId]);

  const handleGenerateAiDiet = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientProfile: profile,
          chronicConditions: profile.chronicConditions || ["Asthma", "Mild Hypertension"],
          allergies: profile.allergies || ["Dust Mites"],
          goal,
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success && data.dietPlan) {
        const generated = data.dietPlan;
        const newPlan: DietPlan = {
          id: `diet_ai_${Date.now()}`,
          patientId: patientUserId,
          patientHealthId: profile.globalHealthId,
          doctorName: "Gemini 3.6 Flash Nutrition AI",
          hospitalName: "Nexus AI Clinical Engine",
          title: generated.title || "Customized Clinical Meal Strategy",
          category: generated.category || "General Wellness",
          createdDate: "Today",
          dailyCaloriesTarget: generated.dailyCaloriesTarget || "1900 kcal",
          waterIntakeLiters: generated.waterIntakeLiters || 3.0,
          meals: generated.meals || {
            breakfast: "Oatmeal with chia seeds & almonds",
            lunch: "Lentil soup, brown rice & steamed vegetables",
            eveningSnack: "Green tea & walnuts",
            dinner: "Vegetable soup & multigrain bread"
          },
          restrictedFoods: generated.restrictedFoods || ["Refined sugars", "Excess sodium"],
          recommendedFoods: generated.recommendedFoods || ["Leafy greens", "Antioxidant berries"],
          doctorAdvice: generated.doctorAdvice || "Follow meal timing strictly.",
        };

        // Save generated plan to backend
        await fetch("/api/patient/add-diet-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPlan),
        });

        setDietPlans((prev) => [newPlan, ...prev]);
      }
    } catch (err) {
      alert("Failed to generate AI diet plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & AI Generator Toolbar */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-indigo-950/60 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-xs font-mono font-bold text-emerald-300">
            <Utensils className="w-3.5 h-3.5" />
            <span>Prescribed & Clinical Nutrition</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Diet & Meal Recommendations</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Diets prescribed by attending physicians or customized by Gemini 3.6 Flash based on blood group (<strong className="text-rose-400">{profile.bloodGroup}</strong>) & health profile.
          </p>
        </div>

        <div className="bg-[#13192B] border border-slate-800 p-4 rounded-2xl space-y-3 shrink-0 w-full md:w-80">
          <label className="block text-xs font-bold text-slate-300">Select Nutrition Focus Goal</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="Heart & Vascular Wellness">❤️ Heart & Vascular Wellness</option>
            <option value="Respiratory & Allergy Care">🫁 Respiratory & Allergy Care</option>
            <option value="Diabetic Glucose Control">🩸 Diabetic Glucose Control</option>
            <option value="Weight & Lean Muscle Balance">🏋️ Weight & Lean Muscle Balance</option>
          </select>

          <button
            onClick={handleGenerateAiDiet}
            disabled={isGenerating}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>{isGenerating ? "Generating Plan..." : "Generate Gemini AI Diet Plan"}</span>
          </button>
        </div>
      </div>

      {/* Active Diet Plans Feed */}
      <div className="space-y-6">
        {dietPlans.map((plan) => (
          <div key={plan.id} className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold rounded-lg uppercase">
                  {plan.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{plan.title}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Prescribed By: <strong className="text-purple-400">{plan.doctorName}</strong> ({plan.hospitalName || "Health System"}) • Date: {plan.createdDate}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="bg-[#0D121F] px-3.5 py-2 rounded-xl border border-slate-800 text-center font-mono">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Daily Target</div>
                  <div className="text-sm font-black text-amber-400">{plan.dailyCaloriesTarget}</div>
                </div>

                <div className="bg-[#0D121F] px-3.5 py-2 rounded-xl border border-slate-800 text-center font-mono">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Water Intake</div>
                  <div className="text-sm font-black text-cyan-400">{plan.waterIntakeLiters} L / day</div>
                </div>
              </div>
            </div>

            {/* Meal Schedule 4 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#0D121F] border border-slate-800 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-amber-400 uppercase text-[10px] flex items-center space-x-1">
                  <span>🍳 Breakfast</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{plan.meals.breakfast}</p>
              </div>

              <div className="bg-[#0D121F] border border-slate-800 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-emerald-400 uppercase text-[10px] flex items-center space-x-1">
                  <span>🥗 Lunch</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{plan.meals.lunch}</p>
              </div>

              <div className="bg-[#0D121F] border border-slate-800 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-purple-400 uppercase text-[10px] flex items-center space-x-1">
                  <span>🍵 Evening Snack</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{plan.meals.eveningSnack}</p>
              </div>

              <div className="bg-[#0D121F] border border-slate-800 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-indigo-400 uppercase text-[10px] flex items-center space-x-1">
                  <span>🍲 Dinner</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{plan.meals.dinner}</p>
              </div>
            </div>

            {/* Food Lists & Clinical Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs pt-2">
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
                <span className="font-bold text-emerald-400 uppercase text-[10px] flex items-center space-x-1">
                  <Apple className="w-3.5 h-3.5" />
                  <span>Recommended Foods</span>
                </span>
                <ul className="space-y-1 text-slate-300">
                  {plan.recommendedFoods.map((f, i) => (
                    <li key={i} className="flex items-center space-x-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-2xl space-y-2">
                <span className="font-bold text-rose-400 uppercase text-[10px] flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Restricted Foods</span>
                </span>
                <ul className="space-y-1 text-slate-300">
                  {plan.restrictedFoods.map((f, i) => (
                    <li key={i} className="flex items-center space-x-1.5">
                      <span className="text-rose-400">✗</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-2xl space-y-2">
                <span className="font-bold text-purple-300 uppercase text-[10px]">Doctor Clinical Advice</span>
                <p className="text-slate-200 leading-relaxed italic">"{plan.doctorAdvice}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
