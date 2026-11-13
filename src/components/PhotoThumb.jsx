import { useBeautySrc } from '../lib/useBeautySrc'
import { FilteredImage } from './FilterLayer'

// Small preview of a photo with the current beauty, filter and filter strength.
const PhotoThumb = ({ src, filter, strength = 1, beauty = {}, alt = '', className = '' }) => {
  const shown = useBeautySrc(src, beauty)
  return <FilteredImage src={shown} filter={filter} strength={strength} alt={alt} className={className} />
}

export default PhotoThumb
