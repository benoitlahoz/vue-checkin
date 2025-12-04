import type { TransformerMode } from '../../types';
import { suggestModelMode, findMostCompleteObject, getDataForMode } from '../model/model-mode.util';

export interface InitializationData {
  mode: TransformerMode;
  templateIndex: number;
  initialData: any;
}

/**
 * Compute initialization values for the transformer
 */
export function initializeTransformer(
  data: Record<string, any> | any[],
  modeOverride?: TransformerMode,
  templateIndexOverride?: number
): InitializationData {
  // Auto-detect mode or use prop
  const autoMode: TransformerMode = suggestModelMode(data) ? 'model' : 'object';
  const mode: TransformerMode = modeOverride ?? autoMode;

  // Auto-detect template index or use prop
  const autoTemplateIndex =
    autoMode === 'model' && Array.isArray(data) ? findMostCompleteObject(data) : 0;
  const templateIndex = templateIndexOverride ?? autoTemplateIndex;

  // Get data based on mode
  const initialData = getDataForMode(data, mode, templateIndex);

  return {
    mode,
    templateIndex,
    initialData,
  };
}
