import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type ObjectWithAnyValues = { [key: string]: unknown };

/**
 * Compares two objects and returns the keys of changed properties.
 * @param baseObject - The original object to compare against.
 * @param newObject - The object to compare.
 * @returns An array of keys whose values differ in the two objects.
 */
export const getChangedKeys = (
  baseObject: ObjectWithAnyValues,
  newObject: ObjectWithAnyValues
): string[] => {
  const changedKeys: string[] = [];

  for (const key in newObject) {
    if (baseObject.hasOwnProperty(key)) {
      // Check if the key exists in both objects and compare values
      if (newObject[key] !== baseObject[key]) {
        changedKeys.push(key);
      }
    }
  }

  return changedKeys;
};
