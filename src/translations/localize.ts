import en from "./en.json";
import lt from "./lt.json";

type TranslationValue = string | TranslationTree;

interface TranslationTree {
    [key: string]: TranslationValue;
}

type TranslationVariables = Record<string, string | number>;

const translations: Record<string, TranslationTree> = {
    en,
    lt,
};

const DEFAULT_LANGUAGE = "en";

const normalizeLanguage = (language?: string): string => {
    const normalizedLanguage = language?.toLowerCase().split("-")[0];

    return normalizedLanguage && normalizedLanguage in translations
        ? normalizedLanguage
        : DEFAULT_LANGUAGE;
};

const getNestedValue = (
    translationsTree: TranslationTree,
    key: string,
): string | undefined => {
    const value = key
        .split(".")
        .reduce<TranslationValue | undefined>((currentValue, keyPart) => {
            if (
                !currentValue ||
                typeof currentValue === "string" ||
                !(keyPart in currentValue)
            ) {
                return undefined;
            }

            return currentValue[keyPart];
        }, translationsTree);

    return typeof value === "string" ? value : undefined;
};

const replaceVariables = (value: string, variables: TranslationVariables): string =>
    value.replace(/\{(\w+)\}/g, (match, variableName: string) => {
        const replacement = variables[variableName];

        return replacement === undefined ? match : String(replacement);
    });

export const localize = (
    key: string,
    language?: string,
    variables: TranslationVariables = {},
): string => {
    const normalizedLanguage = normalizeLanguage(language);

    const translatedValue =
        getNestedValue(translations[normalizedLanguage], key) ??
        getNestedValue(translations[DEFAULT_LANGUAGE], key) ??
        key;

    return replaceVariables(translatedValue, variables);
};

export const getCurrentDocumentLanguage = (): string =>
    document.documentElement.lang || navigator.language || DEFAULT_LANGUAGE;
