import { useParams, useLocation } from 'react-router-dom'
import DatasetTable from '../../components/DatasetTable'
import { useFormDescription } from '../../utils/hooks'

export default function PageDataset({ user }) {
  const location = useLocation()
  const { selectionId } = useParams()
  const rootRoute = location.pathname.split('/')[1]
  const formDesc = useFormDescription(selectionId, rootRoute, user?.u_lang)

  return !formDesc.isLoading &&
    (<DatasetTable
      {...formDesc?.data}
      route={rootRoute}
    />)
}