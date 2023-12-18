import { useParams } from 'react-router-dom'
import DatasetTable from '../../components/DatasetTable'
import { useFormDescription } from '../../utils/hooks'

export default function PageDataset({ route }) {
  const { selectionId } = useParams()
  const formDesc = useFormDescription(selectionId)
  
  return !formDesc.isLoading && <DatasetTable
    {...formDesc?.data}
    route={route}
  />
}