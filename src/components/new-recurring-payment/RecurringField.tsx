import { Button } from '@/core/components/ui/Button';
import { Calendar } from '@/core/components/ui/Calendar';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/Form';
import { Input } from '@/core/components/ui/Input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/Popover';
import { SchedulePaymentType } from '@/lib/models/schedule-payment.model';
import { cn } from '@/lib/utils/tailwind';
import { format, startOfToday } from 'date-fns';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { Key, SyntheticEvent } from 'react';
import {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormReturn,
} from 'react-hook-form';
import { CreatePaymentFormValues } from './CreatePaymentForm';

interface RecurringFieldProps {
  form: UseFormReturn<CreatePaymentFormValues>;
  dateFields: FieldArrayWithId<
    CreatePaymentFormValues,
    'executionDates',
    'id'
  >[];
  append: UseFieldArrayAppend<CreatePaymentFormValues, 'executionDates'>;
  remove: UseFieldArrayRemove;
  currentDate: Date;
}

const RecurringField: React.FC<RecurringFieldProps> = ({
  form,
  dateFields,
  append,
  remove,
  currentDate,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {dateFields.map(
        (dateField: { id: Key | null | undefined }, index: number) => (
          <FormField
            name={`executionDates.${index}.date` as const}
            control={form.control}
            key={dateField.id}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  {index !== 0 && (
                    <Button
                      size="icon"
                      onClick={() => remove(index)}
                      variant="outline"
                      className="rounded-full w-6 h-6"
                    >
                      <X size={16} />
                    </Button>
                  )}

                  <FormLabel>
                    {form.watch('type') === SchedulePaymentType.Fixed
                      ? `#${index + 1} Execution Date`
                      : 'Start Date'}
                  </FormLabel>
                </div>
                <Popover>
                  <div className="flex gap-4">
                    <PopoverTrigger asChild>
                      <FormControl className="flex-1">
                        <Button
                          variant={'outline'}
                          className={cn(
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <Input
                      type="time"
                      step="600"
                      className="flex-1"
                      defaultValue={format(field.value, 'HH:mm')}
                      onChange={(time) => {
                        const timeValue = time.target.value;
                        const [hours, minutes] = timeValue
                          .split(':')
                          .map(Number);

                        // Check if hours and minutes are valid
                        if (isNaN(hours) || isNaN(minutes)) {
                          console.error('Invalid time value');
                          return;
                        }

                        const date = new Date(field.value);
                        date.setHours(hours, minutes);
                        form.setValue(
                          `executionDates.${index}.date` as const,
                          date
                        );
                      }}
                    />
                  </div>

                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(day) => {
                        if (!day) return;

                        day.setHours(
                          field.value.getHours(),
                          field.value.getMinutes()
                        );

                        field.onChange(day);
                      }}
                      disabled={(date) => date < startOfToday()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <FormMessage />
              </FormItem>
            )}
          />
        )
      )}

      {form.watch('type') === SchedulePaymentType.Fixed && (
        <Button
          variant="outline"
          onClick={(event: SyntheticEvent) => {
            append({ date: currentDate });
            event.preventDefault();
          }}
        >
          <Plus size={16} className="mr-2" /> Add execution
        </Button>
      )}
    </div>
  );
};

export default RecurringField;
