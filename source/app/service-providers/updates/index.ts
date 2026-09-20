/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        UpdateProvider
 * CVM-Role:        Service Provider
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     Takes care of downloading any updates to the app.
 *
 * END HEADER
 */

import { ipcMain } from 'electron'
import ProviderContract from '../provider-contract'
import type LogProvider from '../log'
import type CommandProvider from '../commands'
import type ConfigProvider from '@providers/config'
import type WindowProvider from '../windows'

export interface UpdateAsset {
  name: string
  size: number
  browser_download_url: string
}

export interface UpdateState {
  lastErrorMessage: string|undefined
  lastErrorCode: string|undefined
  updateAvailable: boolean
  lastCheck?: number
  prerelease: boolean
  tagName: string
  releasePage: string
  changelog: string
  compatibleAssets: UpdateAsset[]
  checksumFile?: UpdateAsset
  name: string
  full_path: string
  size_total: number
  size_downloaded: number
  start_time: number
  eta_seconds: number
}

function getUpdateState (): UpdateState {
  return {
    lastErrorMessage: undefined,
    lastErrorCode: undefined,
    updateAvailable: false,
    prerelease: false,
    changelog: '',
    releasePage: 'https://github.com/Noia/Noia/releases',
    tagName: '',
    compatibleAssets: [],
    name: '',
    full_path: '',
    size_total: 0,
    size_downloaded: 0,
    start_time: 0,
    eta_seconds: 0
  }
}

export default class UpdateProvider extends ProviderContract {
  private readonly _updateState: UpdateState

  constructor (
    private readonly _logger: LogProvider,
    private readonly _config: ConfigProvider,
    private readonly _commands: CommandProvider,
    private readonly _windows: WindowProvider
  ) {
    super()
    this._logger.verbose('Update provider booting up ...')
    this._updateState = getUpdateState()

    ipcMain.handle('update-provider', async (event, data) => {
      const { command } = data
      if (command === 'update-status') {
        return this._updateState
      }
      return true
    })
  }

  applicationUpdateAvailable (): boolean {
    return false
  }

  getUpdateState (): UpdateState {
    return this._updateState
  }

  async check (): Promise<void> {
    this._logger.info('[Update Provider] Checagem manual de atualizações desativada no Noia.')
  }

  async boot (): Promise<void> {
    this._logger.info('[Update Provider] Atualizações automáticas desativadas no Noia.')
  }

  async shutdown (): Promise<void> {
    this._logger.verbose('Update provider shutting down ...')
  }
}