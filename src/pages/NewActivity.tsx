
import ApiErrorBoundary from "@/components/ApiErrorBoundary";
import { useActivityForm } from "@/hooks/useActivityForm";
import { ActivityForm } from "@/components/activity/ActivityForm";
import { ActivityFormSkeleton } from "@/components/activity/ActivityFormSkeleton";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

const NewActivity = () => {
  const {
    isLoading,
    isSaving,
    participants,
    formData,
    errors,
    handleChange,
    handleSelectChange,
    handleSubmit,
    navigate
  } = useActivityForm();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-6">Log New Activity</h1>
      <ApiErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle>Activity Details</CardTitle>
            <CardDescription>Record your exercise to earn points</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ActivityFormSkeleton />
            ) : (
              <ActivityForm
                formData={formData}
                errors={errors}
                isSaving={isSaving}
                onSubmit={handleSubmit}
                onCancel={() => navigate("/activities")}
                onSelectChange={handleSelectChange}
                onChange={handleChange}
              />
            )}
          </CardContent>
        </Card>
      </ApiErrorBoundary>
    </div>
  );
};

export default NewActivity;
