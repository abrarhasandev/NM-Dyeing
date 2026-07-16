// @ts-nocheck
export default function Stepper({ steps, currentStep, activeTab, onStepClick }) {
    return (
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 z-0 mx-[40px]">
          <div
            className="h-0.5 bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
  
        <div className="flex justify-between relative z-10">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrentStatus = currentStep === step.id;
            const isActiveView = activeTab === step.id;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center text-center cursor-pointer"
                onClick={() => onStepClick(step)}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 
                    ${isActiveView 
                      ? "border-blue-600 bg-blue-100 text-blue-600 shadow-md ring-2 ring-blue-300" // Active viewing tab
                      : isCurrentStatus
                      ? "bg-blue-600 text-white border-blue-600" // Current actual status
                      : isCompleted
                      ? "bg-blue-500 text-white border-blue-500" // Completed steps
                      : "bg-white border-gray-300 text-gray-500" // Future steps
                    }`}
                >
                  {step.id}
                </div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    isActiveView || isCompleted || isCurrentStatus ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step?.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  