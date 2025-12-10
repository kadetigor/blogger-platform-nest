import { IsOptional, ValidateBy, ValidationOptions } from "class-validator";
import { BaseQueryParams } from "src/core/dto/base.query-params.input-dto";
import { Transform } from "class-transformer";

// Allowed fields for sorting in top players statistics
const ALLOWED_SORT_FIELDS = ['avgScores', 'sumScore', 'gamesCount', 'winsCount', 'lossesCount', 'drawsCount'] as const;
type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number];

export interface SortCriterion {
    field: AllowedSortField;
    direction: 'ASC' | 'DESC';
}

// Custom validator for sort parameter
function IsValidSort(validationOptions?: ValidationOptions) {
    return ValidateBy(
        {
            name: 'isValidSort',
            validator: {
                validate(value: any): boolean {
                    if (!value) return true; // Optional field

                    const sortArray = Array.isArray(value) ? value : [value];

                    for (const sortString of sortArray) {
                        if (typeof sortString !== 'string') return false;

                        const parts = sortString.trim().split(/\s+/);
                        if (parts.length !== 2) return false;

                        const [field, direction] = parts;

                        if (!ALLOWED_SORT_FIELDS.includes(field as any)) return false;
                        if (direction !== 'asc' && direction !== 'desc') return false;
                    }

                    return true;
                },
                defaultMessage(): string {
                    return `Sort parameter must be in format "fieldName direction" where field is one of [${ALLOWED_SORT_FIELDS.join(', ')}] and direction is "asc" or "desc"`;
                }
            }
        },
        validationOptions
    );
}

export class GetTopPlayersQueryParams extends BaseQueryParams {
    @IsOptional()
    @IsValidSort()
    @Transform(({ value }) => {
        // If no value provided, use default
        if (!value) {
            return ["avgScores desc", "sumScore desc"];
        }
        // Ensure it's always an array
        return Array.isArray(value) ? value : [value];
    })
    sort: string | string[] = ["avgScores desc", "sumScore desc"];

    /**
     * Parse the sort parameter into structured criteria
     * Returns array of { field, direction } objects
     */
    getParsedSortCriteria(): SortCriterion[] {
        const sortArray = Array.isArray(this.sort) ? this.sort : [this.sort];

        return sortArray.map(sortString => {
            const [field, direction] = sortString.trim().split(/\s+/);
            return {
                field: field as AllowedSortField,
                direction: direction.toUpperCase() as 'ASC' | 'DESC'
            };
        });
    }
}