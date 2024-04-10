import { useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import DatasetTable from '../../components/DatasetTable'
import { useFormDescription, useLangs } from '../../utils/hooks'

const defaultLang = 1

export default function PageDataset({ user }) {
  const location = useLocation()
  const { selectionId } = useParams()
  const rootRoute = location.pathname.split('/')[1]
  const langs = useLangs()
  const formDesc = useFormDescription(selectionId, rootRoute, user?.u_lang)

  return !formDesc.isLoading && <DatasetTable
    {...formDesc?.data}
    route={rootRoute}
  />
}