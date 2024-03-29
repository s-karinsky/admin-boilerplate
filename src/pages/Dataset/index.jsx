import { useParams, useLocation } from 'react-router-dom'
import DatasetTable from '../../components/DatasetTable'
import { useFormDescription } from '../../utils/hooks'

export default function PageDataset() {
  const location = useLocation()
  const { selectionId } = useParams()
  const rootRoute = location.pathname.split('/')[1]
  const formDesc = useFormDescription(selectionId, rootRoute)

  return !formDesc.isLoading && <DatasetTable
    {...formDesc?.data}
    route={rootRoute}
  />
}