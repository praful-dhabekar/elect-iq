import { useT } from '../context/TranslationContext';
import PropTypes from 'prop-types';

/**
 * T — transparent translation wrapper component.
 *
 * Usage: <T>Some static English string</T>
 *
 * Why: Decouples translation logic from UI components. Shows original text
 * while a translation is in flight (no spinner → no layout shift).
 * Do NOT wrap: proper nouns, dates, URLs, code snippets.
 *
 * @param {{ children: string }} props
 */
export default function T({ children }) {
  const { t } = useT();
  // t() returns the original string immediately if language is 'en' or not yet cached
  return t(children);
}

T.propTypes = {
  children: PropTypes.string.isRequired,
};
